"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Cpu } from "lucide-react";
import type {
  AgentEvent,
  Channel,
  CVFrame,
  MLMeta,
  ScenarioMeta,
  SensorFrame,
  WorkOrder,
} from "@/lib/types";
import { getScenarios, triggerScenario } from "@/lib/api";
import { subscribeSession } from "@/lib/sse";
import { Panel, Stat } from "./ui";
import ScenarioTrigger from "./ScenarioTrigger";
import NotificationsFeed, { Notification } from "./NotificationsFeed";
import SensorChart from "./SensorChart";
import VisionPanel from "./VisionPanel";
import IncidentDetail from "./IncidentDetail";

export default function Dashboard() {
  const [scenarios, setScenarios] = useState<ScenarioMeta[]>([]);
  const [meta, setMeta] = useState<ScenarioMeta | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [ml, setMl] = useState<MLMeta | undefined>();
  const [sensorFrames, setSensorFrames] = useState<SensorFrame[]>([]);
  const [cvFrames, setCvFrames] = useState<CVFrame[]>([]);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [notif, setNotif] = useState<Notification | null>(null);
  const [report, setReport] = useState<string | undefined>();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [cached, setCached] = useState(false);
  const [tokens, setTokens] = useState(0);
  const [cost, setCost] = useState(0);
  const [playhead, setPlayhead] = useState(0);
  const [running, setRunning] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const closeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    getScenarios().then(setScenarios).catch(() => setScenarios([]));
    return () => closeRef.current?.();
  }, []);

  const onTrigger = useCallback(async (id: string) => {
    closeRef.current?.();
    setSensorFrames([]); setCvFrames([]); setAgentEvents([]);
    setNotif(null); setReport(undefined); setWorkOrder(null);
    setCached(false); setTokens(0); setCost(0); setPlayhead(0); setDetailOpen(false);
    setRunning(true);

    const res = await triggerScenario(id);
    setMeta(res.meta); setChannels(res.channels);
    setMl(res.ml); // backend includes ml in trigger response

    closeRef.current = subscribeSession(res.session, {
      onSensor: (e) => {
        const ev = e as { type: string; frame?: SensorFrame; playhead_t?: number };
        if (ev.type === "sensor" && ev.frame) {
          setSensorFrames((p) => [...p, ev.frame!]);
          if (ev.playhead_t != null) setPlayhead(ev.playhead_t);
        }
        if (ev.type === "end") setRunning(false);
      },
      onCV: (e) => {
        const ev = e as { type: string; frame?: CVFrame };
        if (ev.type === "cv" && ev.frame) setCvFrames((p) => [...p, ev.frame!]);
      },
      onAgent: (e) => {
        const ev = e as AgentEvent;
        setAgentEvents((p) => [...p, ev]);
        if (ev.cached) setCached(true);
        if (typeof ev.tokens === "number") setTokens((t) => t + (ev.tokens ?? 0));
        if (typeof ev.cost === "number") setCost((c) => c + (ev.cost ?? 0));
        if (ev.type === "notification") {
          setNotif({
            session: res.session, scenario: id, title: ev.title ?? "Anomaly detected",
            equipment_id: ev.equipment_id ?? res.meta.equipment_id, line: ev.line ?? res.meta.line,
            severity: ev.severity ?? res.meta.severity, t: ev.t ?? 0, analyzing: true, done: false,
          });
        }
        if (ev.type === "work_order" && ev.wo) setWorkOrder(ev.wo);
        if (ev.type === "report") {
          setReport(ev.markdown);
          setNotif((n) => (n ? { ...n, analyzing: false, done: true } : n));
        }
      },
    });
  }, []);

  const latestCV = cvFrames[cvFrames.length - 1];
  const defectRate = latestCV?.defect_rate;
  const activeAlerts = notif ? 1 : 0;

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-5">
      {/* header */}
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-lg">🔥</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--text)]">OvenMind</h1>
            <p className="text-[11px] text-[var(--muted)]">
              Agentic maintenance × food vision · <span className="text-[var(--accent)]">simulated demo</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] text-[var(--muted)]"
            style={{ borderColor: "var(--border)" }}>
            <Activity className="h-3.5 w-3.5 text-emerald-400" /> {running ? "streaming" : "idle"}
          </div>
          <div className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] text-[var(--muted)]"
            style={{ borderColor: "var(--border)" }}>
            <Cpu className="h-3.5 w-3.5 text-violet-400" /> LangGraph · Claude
          </div>
        </div>
      </header>

      {/* trigger */}
      <Panel title="Trigger scenario — failure injection (operator control)" className="mb-4">
        <ScenarioTrigger scenarios={scenarios} activeId={meta?.id} disabled={running} onTrigger={onTrigger} />
      </Panel>

      {/* KPI tiles */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active line" value={meta?.line ?? "—"} sub={meta?.equipment_id} />
        <Stat label="Active alerts" value={activeAlerts} accent={activeAlerts > 0} />
        <Stat label="Defect rate" value={latestCV ? `${latestCV.defect_rate.toFixed(1)}%` : "—"}
          sub={meta ? `baseline ${ml?.baseline_rate ?? 0.4}%` : undefined} />
        <Stat label="Playhead" value={`${playhead.toFixed(1)}s`} sub={meta ? `of ${meta.duration_s}s` : undefined} />
      </div>

      {/* main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Sensor telemetry" className="lg:col-span-2">
          {channels.length ? (
            <SensorChart channels={channels} frames={sensorFrames} fireAt={meta?.fire_at_t} height={260} />
          ) : (
            <Empty>Trigger a scenario to stream sensor telemetry.</Empty>
          )}
        </Panel>

        <Panel title="Notifications" right={notif && <span className="text-[10px] text-[var(--accent)]">click to open</span>}>
          <NotificationsFeed notifications={notif ? [notif] : []} onOpen={() => setDetailOpen(true)} />
        </Panel>

        <Panel title="Line camera · vision model" className="lg:col-span-2">
          {meta ? (
            <VisionPanel image={meta.image} detections={latestCV?.detections ?? []}
              defectRate={defectRate} threshold={ml?.conf_threshold ?? 0.5} showChart={false} />
          ) : (
            <Empty>Trigger a scenario to view the line camera feed.</Empty>
          )}
        </Panel>

        <Panel title="Agent activity">
          <div className="space-y-1.5 text-[12px]">
            {agentEvents.length === 0 && <Empty>Agents idle.</Empty>}
            {agentEvents.slice(-8).map((e, i) => (
              <AgentLine key={i} e={e} />
            ))}
          </div>
        </Panel>
      </div>

      {meta && (
        <IncidentDetail
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          meta={meta}
          channels={channels}
          sensorFrames={sensorFrames}
          cvFrames={cvFrames}
          agentEvents={agentEvents}
          reportMarkdown={report}
          workOrder={workOrder}
          ml={ml}
          playhead={playhead}
          cached={cached}
          tokens={tokens}
          cost={cost}
        />
      )}
    </main>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-40 items-center justify-center text-center text-sm text-[var(--muted)]">
      {children}
    </div>
  );
}

function AgentLine({ e }: { e: AgentEvent }) {
  const map: Record<string, string> = {
    supervisor: `Supervisor → ${e.next}`,
    agent_start: `${e.agent} started`,
    tool_call: `${e.agent} · ${e.tool}()`,
    agent_done: `${e.agent} done`,
    work_order: `Work order ${e.wo?.wo_id ?? ""} created`,
    report: "Incident report ready",
    notification: "⚠ anomaly detected",
    error: `error: ${e.message}`,
  };
  const text = map[e.type];
  if (!text) return null;
  return (
    <div className="flex items-center gap-2 text-[var(--muted)]">
      <span className="mono text-[10px] text-[var(--accent)]">{(e.t ?? 0).toFixed(1)}s</span>
      <span className="truncate text-[var(--text)]/80">{text}</span>
    </div>
  );
}
