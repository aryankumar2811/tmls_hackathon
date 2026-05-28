# frontend/components/

Industrial operations console (IBM Plex, restrained dark palette, no decorative motion).

| Component | Role |
|---|---|
| `Dashboard.tsx` | Orchestrator: loads scenarios, holds per-incident state, opens SSE streams |
| `SimulateMenu.tsx` | Secondary demo control — inject a simulated fault event |
| `LineStatus.tsx` | Per-line health tiles (Operational / Watch / Warning / Critical) |
| `IssuesList.tsx` | Active-issues list; click a row to open the incident |
| `IncidentDetail.tsx` | Slide-over with tabs: Overview · Agent report · Raw ML output |
| `AgentWorkflow.tsx` | Static reasoning trace (agents, tool calls, tokens/cost) |
| `VisionPanel.tsx` | Vision output — products + detection boxes from one source (aligned) |
| `PredictivePanel.tsx` | Predictive output — failure-prob gauge, feature contributions, sensor trace |
| `SensorChart.tsx` / `ConfidenceChart.tsx` / `Chart.tsx` | ECharts wrappers |
| `ui.tsx` | Panel, SeverityBadge, StatusBadge, Metric primitives |

The home is a monitoring view (lines + active issues). Detail/ML/telemetry live inside
the incident slide-over, opened by clicking an issue.
