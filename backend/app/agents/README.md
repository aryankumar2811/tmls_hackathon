# agents/

LangGraph supervisor + 5 specialist agents.

| File | Model | Role |
|---|---|---|
| `supervisor.py` | Sonnet 4.6 | Orchestrator — chooses which sub-agent to invoke based on observed state |
| `equipment_agent.py` | Haiku 4.5 | Reads sensors, estimates RUL, explains anomalies |
| `quality_agent.py` | Haiku 4.5 | Reads CV detections, computes defect-rate spikes |
| `correlation_agent.py` | **Sonnet 4.6** | The "wow" agent — cross-modal causal inference. Spend Wednesday here. |
| `workorder_agent.py` | Haiku 4.5 | Creates work order, generates PDF, posts to Slack |
| `reporting_agent.py` | Haiku 4.5 | Drafts summary report |
| `state.py` | — | Shared LangGraph state (sensor window, CV window, hypotheses, audit log) |

## Guardrails (baked into the supervisor)
- `MAX_SUPERVISOR_TURNS=8` — hard iteration cap. Without it a retry loop can burn $180.
- `MAX_TOKENS_PER_AGENT=4000` — per-agent output ceiling.

## Agentic, not a chatbot — verify all three:
1. Supervisor **chooses** the sub-agent from observed state.
2. Each sub-agent makes its own tool-call decisions.
3. At least one branch point is non-deterministic.

Supervisor pattern is **tool-calls**, not the deprecated `langgraph-supervisor` library.
