# frontend/

Owner: **Frontend lead**.

The "control room" — Next.js 15 (App Router) + Tailwind + shadcn/ui + Apache ECharts.
Dark mode, big readable fonts (you present on a laptop while judges stand). Scaffold
the look fast with **v0.dev**.

## Layout — 4 panes
- **SensorPanel** — live ECharts line charts from `GET /stream/sensors` (SSE).
- **CVFeed** — looping bakery video with detection bounding boxes from `GET /stream/cv`.
- **AgentLog** — streaming agent reasoning from `GET /stream/agent`.
- **WorkOrderPanel** — the generated WO + severity badge + $ impact.
- **TriggerScenario** — dropdown that POSTs to `/trigger` (the demo control surface).
- **ReasoningModal** — "Show reasoning": full agent graph, tool calls, tokens, cost.

## Run
```bash
npm install
npm run dev            # http://localhost:3000
```
Set `NEXT_PUBLIC_API_BASE` (defaults to http://localhost:8000).

The dashboard is implemented (`components/Dashboard.tsx` orchestrates SSE + state).
Clicking a notification opens `IncidentDetail` with the Report / Agent Workflow /
ML Models tabs. Build is verified: `npm run build` compiles clean.

Deploy to **Vercel** (one `git push`); set `NEXT_PUBLIC_API_BASE` to the backend URL.
