# frontend/components/

shadcn/ui-based components. Build with v0.dev, then refine. Dark theme, big fonts.

| Component | Data source |
|---|---|
| `SensorPanel.tsx` | ECharts line charts ← `GET /stream/sensors` (SSE) |
| `CVFeed.tsx` | Looping video + detection bboxes ← `GET /stream/cv` (SSE) |
| `AgentLog.tsx` | Streaming reasoning log ← `GET /stream/agent` (SSE) |
| `WorkOrderPanel.tsx` | Generated WO, severity badge, $ impact |
| `TriggerScenario.tsx` | Dropdown → `POST /trigger?scenario=...` |
| `ReasoningModal.tsx` | "Show reasoning": agent graph, tool calls, tokens, cost |

Use the `subscribe()` helper in `../lib/sse.ts` for all SSE wiring.
