// OvenMind control-room dashboard shell.
// TODO (Tue): replace placeholder panes with the real components in components/,
// wire each to its SSE stream (see lib/sse.ts).

export default function Dashboard() {
  return (
    <main className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">🔥 OvenMind — Line 3 Control Room</h1>
        {/* TODO: <TriggerScenario /> dropdown -> POST /trigger */}
        <div className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-400">
          Trigger Scenario ▾ (TODO)
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* TODO: <SensorPanel /> — GET /stream/sensors */}
        <Pane title="Sensors" />
        {/* TODO: <CVFeed /> — GET /stream/cv */}
        <Pane title="CV Feed" />
        {/* TODO: <AgentLog /> — GET /stream/agent */}
        <Pane title="Agent Log" />
        {/* TODO: <WorkOrderPanel /> */}
        <Pane title="Work Order" />
      </div>

      {/* TODO: <ReasoningModal /> — "Show reasoning": agent graph, tool calls, tokens, cost */}
    </main>
  );
}

function Pane({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
        {title}
      </h2>
      <div className="flex h-48 items-center justify-center text-neutral-600">
        TODO
      </div>
    </section>
  );
}
