"""Shared agent runtime: model selection, tool wrapping, the tool-calling loop,
and token/cost accounting. Used by every specialist node in the graph.

Each specialist makes REAL Claude calls and REAL tool calls (tools read the
replayed session window). Events are emitted to the session's agent stream as the
node runs, so the UI shows the workflow live.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Callable

from backend.app import sessions
from backend.app.config import settings

# $ per token (input, output)
_PRICES = {
    "sonnet": (3e-6, 15e-6),
    "haiku": (1e-6, 5e-6),
    "opus": (15e-6, 75e-6),
}


@dataclass
class AgentConfig:
    name: str
    role: str
    model: str  # "sonnet" | "haiku"
    system_prompt: str
    tools: list[Callable] = field(default_factory=list)
    task: str = "Analyze the current line state and report your findings concisely."
    max_tool_iters: int = 3


def _model_id(kind: str) -> str:
    return settings.orchestrator_model if kind == "sonnet" else settings.agent_model


def _price(kind: str, usage: dict) -> float:
    pin, pout = _PRICES.get(kind, _PRICES["haiku"])
    return usage.get("input_tokens", 0) * pin + usage.get("output_tokens", 0) * pout


def _text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):  # anthropic returns a list of content blocks
        return "".join(b.get("text", "") for b in content if isinstance(b, dict))
    return str(content)


def _make_llm(kind: str, tools: list):
    from langchain_anthropic import ChatAnthropic
    from langchain_core.tools import StructuredTool

    llm = ChatAnthropic(
        model=_model_id(kind),
        max_tokens=settings.max_tokens_per_agent,
        temperature=0,
        api_key=settings.anthropic_api_key or None,
    )
    if not tools:
        return llm, {}
    lc_tools = [
        StructuredTool.from_function(
            func=f, name=f.__name__, description=(f.__doc__ or f.__name__).strip()
        )
        for f in tools
    ]
    return llm.bind_tools(lc_tools), {f.__name__: f for f in tools}


async def run_agent(cfg: AgentConfig, context: str = "") -> dict:
    """Run one specialist agent: bounded tool-calling loop + final summary.

    Returns {agent, summary, tools, tokens, cost}. Emits live events to the session.
    """
    from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage

    s = sessions.current()
    llm, funcs = _make_llm(cfg.model, cfg.tools)

    s.emit("agent", {"type": "agent_start", "agent": cfg.name, "role": cfg.role,
                     "model": _model_id(cfg.model), "t": s.playhead_t})

    msgs = [SystemMessage(content=cfg.system_prompt),
            HumanMessage(content=f"{cfg.task}\n\n{context}".strip())]
    tokens, cost, tool_results = 0, 0.0, {}
    resp = None

    for _ in range(cfg.max_tool_iters):
        resp = await llm.ainvoke(msgs)
        msgs.append(resp)
        usage = getattr(resp, "usage_metadata", None) or {}
        tokens += usage.get("total_tokens", 0)
        cost += _price(cfg.model, usage)

        tool_calls = getattr(resp, "tool_calls", None) or []
        if not tool_calls:
            break
        for tc in tool_calls:
            name, args = tc["name"], tc.get("args", {})
            s.emit("agent", {"type": "tool_call", "agent": cfg.name,
                             "tool": name, "args": args, "t": s.playhead_t})
            try:
                result = funcs[name](**args)
            except Exception as exc:  # surface the error to the model, keep going
                result = {"error": str(exc)}
            tool_results[name] = result
            s.emit("agent", {"type": "tool_result", "agent": cfg.name,
                             "tool": name, "result": result, "t": s.playhead_t})
            msgs.append(ToolMessage(content=json.dumps(result, default=str),
                                    tool_call_id=tc["id"]))

    summary = _text(resp.content) if resp is not None else ""
    s.tokens += tokens
    s.cost_usd += cost
    s.emit("agent", {"type": "agent_done", "agent": cfg.name, "summary": summary,
                     "tokens": tokens, "cost": round(cost, 4), "t": s.playhead_t})
    return {"agent": cfg.name, "summary": summary, "tools": tool_results,
            "tokens": tokens, "cost": cost}
