"""Correlation Agent (Claude Sonnet 4.6) — THE "WOW" AGENT.

Cross-modal causal inference: when a sensor anomaly and a CV defect align in
time AND space, posit a single root cause rather than two independent incidents.
This agent's reasoning quality makes or breaks the demo — spend Wednesday here.

Tools: get_sensor_window, get_cv_window, compute_correlation, rag_lookup_incident,
query_rag, log_action.

Prompt-engineering notes:
- Few-shot the canonical case: oven Zone 2 element drift -> top-surface browning defect.
- Make the temporal + spatial alignment reasoning explicit and visible (it streams to the UI).
- Fallback (Wed EOD): if reasoning is shaky, hardcode the demo correlation as a
  few-shot example and call it "domain-tuned reasoning."

TODO (Wed): create_react_agent (Sonnet) + the system prompt + few-shots.
"""

from backend.app.config import settings


def build_correlation_agent():
    raise NotImplementedError("TODO (Wed): build Correlation agent (Sonnet)")
