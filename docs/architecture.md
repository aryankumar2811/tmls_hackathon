# OvenMind Architecture

## Agent graph

```
                    ┌──────────────────────────────┐
                    │   ORCHESTRATOR (Sonnet 4.6)  │
                    │     LangGraph supervisor     │
                    └──────────────┬───────────────┘
                                   │ handoff tools
        ┌──────────────┬───────────┼───────────┬──────────────┐
        ▼              ▼           ▼           ▼              ▼
  EQUIPMENT       QUALITY     CORRELATION  WORK-ORDER    REPORTING
  AGENT           AGENT       AGENT        AGENT         AGENT
  (Haiku 4.5)     (Haiku 4.5) (Sonnet 4.6) (Haiku 4.5)   (Haiku 4.5)
   │               │            │            │             │
   ▼               ▼            ▼            ▼             ▼
 query_sensor()  query_cv()   rag_search()  create_wo()  draft_report()
 get_rul()       get_defect_  link_         post_slack() generate_pdf()
 explain_why()   rate()       timeline()
```

**The Correlation Agent gets Sonnet (not Haiku)** because its reasoning quality is what makes the demo "wow." Pay the tokens.

## Tools

| Module | Tools |
|---|---|
| `tools/sensor_tools.py` | `query_sensor`, `get_rul`, `get_sensor_window` |
| `tools/cv_tools.py` | `query_cv`, `get_defect_rate`, `get_cv_window` |
| `tools/correlation_tools.py` | `compute_correlation`, `link_timeline` |
| `tools/rag_tools.py` | `query_rag`, `rag_lookup_incident` |
| `tools/workorder_tools.py` | `create_wo`, `generate_pdf`, `post_slack` |
| `tools/audit_tools.py` | `log_action` (writes to the audit-trail UI) |

**Shared by every agent:** `query_rag(collection, query)`, `log_action(reasoning)`.

## Data flow (the demo path)

1. **Trigger** — user clicks a scenario in the UI → `simulator/scenarios.py` starts emitting drift.
2. **Sensors** — `drift_simulator.py` streams 8 channels @ 2 Hz over SSE → dashboard + Equipment Agent.
3. **CV** — `cv/infer.py` emits defect detections (bounding boxes) over SSE → dashboard + Quality Agent.
4. **Correlation** — Correlation Agent (Sonnet) temporally/spatially aligns the sensor anomaly and the CV defect, posits a single root cause.
5. **RAG** — `rag_lookup_incident` retrieves the seeded matching incident (INC-2025-0317) via hybrid BM25 + semantic search.
6. **Action** — Work-Order Agent generates a ReportLab PDF and posts it to Slack with severity + $ impact.
7. **Audit** — every tool call, RAG hit, handoff, token count and cost is logged and shown in the "Show reasoning" modal.

## Genuinely agentic checklist (or it's just a fancy chatbot)

- [ ] Supervisor **chooses** which sub-agent to invoke based on observed state.
- [ ] Each sub-agent makes its own tool-call decisions (not a fixed pipeline).
- [ ] At least one branch point is non-deterministic.

## Cost guardrails (non-negotiable)

A 3+ agent supervisor costs ~3× a single mega-agent, and a runaway retry loop can burn $180 in one request.

- `MAX_SUPERVISOR_TURNS=8` — hard cap on supervisor iterations.
- `MAX_TOKENS_PER_AGENT=4000` — per-agent output ceiling.
- Pre-test the demo scenario 20× — aim for 0/20 failures with the cached/scripted version.

## Fallbacks (decide by the listed deadline)

- Supervisor not routing reliably by **Tue EOD** → fall back to OpenAI Agents SDK handoff pattern.
- YOLOv11 inference > 2 s by **Wed noon** → YOLOv11-nano on CPU + cache results (do not re-run on stage).
- Correlation reasoning shaky by **Wed EOD** → hardcode the demo correlation as a few-shot example; call it "domain-tuned reasoning."
- Claude API rate-limits on stage → fall back to GPT-4o-mini with the same prompts.
