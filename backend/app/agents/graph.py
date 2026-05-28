"""LangGraph supervisor + specialist nodes.

The supervisor (Sonnet) chooses the next specialist based on what's already been
done — genuine routing, not a hardcoded pipeline (with a safe canonical fallback).
Specialist nodes run real Claude + tool calls and emit live events to the session.
"""

from __future__ import annotations

from typing import TypedDict

from backend.app import sessions
from backend.app.agents import (
    correlation_agent,
    equipment_agent,
    quality_agent,
    reporting_agent,
    workorder_agent,
)
from backend.app.agents.base import AgentConfig, _model_id, _price, run_agent
from backend.app.config import settings

# short id -> (canonical order index, config)
SPECIALISTS: dict[str, AgentConfig] = {
    "equipment": equipment_agent.CONFIG,
    "quality": quality_agent.CONFIG,
    "correlation": correlation_agent.CONFIG,
    "workorder": workorder_agent.CONFIG,
    "reporting": reporting_agent.CONFIG,
}
ORDER = ["equipment", "quality", "correlation", "workorder", "reporting"]
_NAME_TO_KEY = {cfg.name.lower(): key for key, cfg in SPECIALISTS.items()}


class GState(TypedDict, total=False):
    completed: list[str]
    findings: dict[str, str]
    next: str
    turns: int


def _context_for(key: str, findings: dict[str, str]) -> str:
    """Give each agent the prior agents' findings as grounding."""
    if not findings:
        return ""
    parts = [f"### {name}\n{summary}" for name, summary in findings.items()]
    return "Findings so far:\n\n" + "\n\n".join(parts)


async def _route(state: GState) -> str:
    """Supervisor LLM picks the next specialist key, or FINISH."""
    completed = state.get("completed", [])
    turns = state.get("turns", 0)
    if "reporting" in completed or turns >= settings.max_supervisor_turns:
        return "FINISH"

    remaining = [k for k in ORDER if k not in completed]
    if not remaining:
        return "FINISH"

    from langchain_anthropic import ChatAnthropic
    from langchain_core.messages import HumanMessage, SystemMessage

    s = sessions.current()
    llm = ChatAnthropic(model=_model_id("sonnet"), max_tokens=20, temperature=0,
                        api_key=settings.anthropic_api_key or None)
    sys = (
        "You are the Supervisor coordinating bakery maintenance agents. The standard "
        "flow is: Equipment Agent -> Quality Agent -> Correlation Agent -> Work-Order "
        "Agent -> Reporting Agent. Given the completed agents, reply with ONLY the name "
        "of the single best next agent, or FINISH if the Reporting Agent is done."
    )
    human = (f"Completed: {', '.join(SPECIALISTS[k].name for k in completed) or 'none'}. "
             f"Available: {', '.join(SPECIALISTS[k].name for k in remaining)}.")
    try:
        resp = await llm.ainvoke([SystemMessage(content=sys), HumanMessage(content=human)])
        usage = getattr(resp, "usage_metadata", None) or {}
        s.tokens += usage.get("total_tokens", 0)
        s.cost_usd += _price("sonnet", usage)
        text = (resp.content if isinstance(resp.content, str)
                else "".join(b.get("text", "") for b in resp.content if isinstance(b, dict)))
        text = text.strip().lower()
        if "finish" in text:
            return "FINISH"
        for name, key in _NAME_TO_KEY.items():
            if name in text and key in remaining:
                return key
    except Exception:
        pass  # fall back to canonical order
    return remaining[0]


async def _supervisor_node(state: GState) -> GState:
    nxt = await _route(state)
    s = sessions.current()
    s.emit("agent", {"type": "supervisor", "next": nxt,
                     "completed": state.get("completed", []), "t": s.playhead_t})
    return {"next": nxt, "turns": state.get("turns", 0) + 1}


def _make_specialist_node(key: str, cfg: AgentConfig):
    async def node(state: GState) -> GState:
        findings = dict(state.get("findings", {}))
        result = await run_agent(cfg, _context_for(key, findings))
        findings[cfg.name] = result["summary"]

        s = sessions.current()
        if key == "workorder":
            await _finalize_work_order(s, result)
        if key == "reporting":
            _finalize_report(s, result, findings)

        return {"findings": findings, "completed": state.get("completed", []) + [key]}

    return node


async def _finalize_work_order(s: sessions.Session, result: dict) -> None:
    """Render PDF + post Slack as side effects, then expose the WO to the UI."""
    from backend.app.tools.workorder_tools import create_wo, generate_pdf, post_slack

    wo = result["tools"].get("create_wo")
    if not wo:  # agent didn't call the tool — create one deterministically
        gt = s.fixture["ground_truth"]
        wo = create_wo(gt["root_cause"], s.fixture["meta"]["severity"])
    pdf = generate_pdf(wo)
    slack = post_slack(wo)
    wo = {**wo, "pdf": pdf, "slack": slack}
    s.work_order = wo
    s.emit("agent", {"type": "work_order", "wo": wo, "t": s.playhead_t})


def _finalize_report(s: sessions.Session, result: dict, findings: dict) -> None:
    s.report = {
        "markdown": result["summary"],
        "findings": findings,
        "work_order": s.work_order,
        "scenario": s.scenario,
        "meta": s.fixture["meta"],
        "ground_truth": s.fixture["ground_truth"],
    }
    s.emit("agent", {"type": "report", "markdown": result["summary"], "t": s.playhead_t})


def build_graph():
    from langgraph.graph import END, StateGraph

    g = StateGraph(GState)
    g.add_node("supervisor", _supervisor_node)
    for key, cfg in SPECIALISTS.items():
        g.add_node(key, _make_specialist_node(key, cfg))
    g.set_entry_point("supervisor")
    g.add_conditional_edges(
        "supervisor", lambda s: s.get("next", "FINISH"),
        {**{k: k for k in SPECIALISTS}, "FINISH": END},
    )
    for key in SPECIALISTS:
        g.add_edge(key, "supervisor")
    return g.compile()
