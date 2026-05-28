"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AgentEvent,
  CVFrame,
  Incident,
  ScenarioMeta,
  SensorFrame,
} from "@/lib/types";
import { getScenarios, triggerScenario } from "@/lib/api";
import { subscribeSession } from "@/lib/sse";
import { Panel } from "./ui";
import SimulateMenu from "./SimulateMenu";
import LineStatus from "./LineStatus";
import IssuesList from "./IssuesList";
import IncidentDetail from "./IncidentDetail";

export default function Dashboard() {
  const [scenarios, setScenarios] = useState<ScenarioMeta[]>([]);
  const [incidents, setIncidents] = useState<Record<string, Incident>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const closers = useRef<Record<string, () => void>>({});

  useEffect(() => {
    getScenarios().then(setScenarios).catch(() => setScenarios([]));
    return () => Object.values(closers.current).forEach((c) => c());
  }, []);

  const patch = useCallback((sid: string, fn: (i: Incident) => Incident) => {
    setIncidents((p) => (p[sid] ? { ...p, [sid]: fn(p[sid]) } : p));
  }, []);

  const onSimulate = useCallback(async (id: string) => {
    const res = await triggerScenario(id);
    const sid = res.session;
    setIncidents((p) => ({
      ...p,
      [sid]: {
        session: sid, meta: res.meta, channels: res.channels, ml: res.ml,
        groundTruth: res.ground_truth, sensorFrames: [], cvFrames: [], agentEvents: [],
        status: "investigating", cached: false, tokens: 0, cost: 0,
        detectedAt: Date.now(), playhead: 0,
      },
    }));

    closers.current[sid] = subscribeSession(sid, {
      onSensor: (e) => {
        const ev = e as { type: string; frame?: SensorFrame; playhead_t?: number };
        if (ev.type === "sensor" && ev.frame) {
          patch(sid, (i) => ({ ...i, sensorFrames: [...i.sensorFrames, ev.frame!], playhead: ev.playhead_t ?? i.playhead }));
        }
      },
      onCV: (e) => {
        const ev = e as { type: string; frame?: CVFrame };
        if (ev.type === "cv" && ev.frame) patch(sid, (i) => ({ ...i, cvFrames: [...i.cvFrames, ev.frame!] }));
      },
      onAgent: (e) => {
        const ev = e as AgentEvent;
        patch(sid, (i) => {
          const next: Incident = { ...i, agentEvents: [...i.agentEvents, ev] };
          if (ev.cached) next.cached = true;
          if (typeof ev.tokens === "number") next.tokens = i.tokens + ev.tokens;
          if (typeof ev.cost === "number") next.cost = i.cost + ev.cost;
          if (ev.type === "work_order" && ev.wo) next.workOrder = ev.wo;
          if (ev.type === "report") { next.report = ev.markdown; next.status = "diagnosed"; }
          return next;
        });
      },
    });
  }, [patch]);

  const list = useMemo(() => Object.values(incidents), [incidents]);

  const lines = useMemo(() => {
    const seen = new Map<string, string>();
    scenarios.forEach((s) => { if (!seen.has(s.line)) seen.set(s.line, s.equipment_id); });
    return [...seen.entries()].sort().map(([line, equipment_id]) => ({ line, equipment_id }));
  }, [scenarios]);

  const active = selected ? incidents[selected] : null;
  const openCount = list.length;

  return (
    <div className="min-h-screen">
      {/* top bar */}
      <header className="sticky top-0 z-20 border-b bg-[var(--bg)]/95 backdrop-blur"
        style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-6 w-6 place-items-center rounded-[5px] border text-[11px] font-semibold text-[var(--text)]"
              style={{ borderColor: "var(--border-strong)" }}>OM</span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-[15px] font-semibold tracking-tight text-[var(--text)]">OvenMind</span>
              <span className="text-[12px] text-[var(--faint)]">Operations</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[12px] text-[var(--muted)] sm:inline">
              FGF — Toronto Plant · {lines.length} lines monitored
            </span>
            <SimulateMenu scenarios={scenarios} onSelect={onSimulate} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] space-y-5 px-6 py-6">
        <section className="space-y-2.5">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">Lines</h2>
          <LineStatus lines={lines} incidents={list} />
        </section>

        <Panel
          title="Active issues"
          bodyClassName="py-1.5"
          right={<span className="mono text-[11px] text-[var(--faint)]">{openCount} open</span>}
        >
          <IssuesList incidents={list} onOpen={setSelected} />
        </Panel>

        <p className="text-[11px] text-[var(--faint)]">
          Telemetry and imagery are simulated for this demo. Agent diagnosis is produced by
          live Claude calls over the simulated signals.
        </p>
      </main>

      {active && (
        <IncidentDetail incident={active} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
