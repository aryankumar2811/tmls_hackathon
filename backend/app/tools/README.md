# tools/

**One tool = one function. Every tool call in the demo must be REAL** — no faking
inside the agent loop. Only the *triggering event* and the RAG seeding are scripted.

Each function below is decorated as a LangChain/LangGraph `@tool` and bound to the
agent(s) that need it. All agents also share `query_rag` and `log_action`.

| File | Tools | Used by |
|---|---|---|
| `sensor_tools.py` | `query_sensor`, `get_rul`, `get_sensor_window` | Equipment, Correlation |
| `cv_tools.py` | `query_cv`, `get_defect_rate`, `get_cv_window` | Quality, Correlation |
| `correlation_tools.py` | `compute_correlation`, `link_timeline` | Correlation |
| `rag_tools.py` | `query_rag`, `rag_lookup_incident` | all |
| `workorder_tools.py` | `create_wo`, `generate_pdf`, `post_slack` | Work-Order |
| `audit_tools.py` | `log_action` | all |
