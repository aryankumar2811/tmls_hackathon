"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AgentEvent, Issue, IssueState, ModelInfo } from "@/lib/types";
import { analyzeIssue, getIssues, getModelInfo, runSimulation } from "@/lib/api";
import { subscribeAgentStream } from "@/lib/sse";
import { Panel } from "./ui";
import RunSimulationButton from "./RunSimulationButton";
import IssuesList from "./IssuesList";
import IncidentDetail from "./IncidentDetail";

function toState(issue: Issue): IssueState {
  return {
    ...issue,
    analysisStatus: "idle",
    agentEvents: [],
    tokens: 0,
    cost: 0,
    cached: false,
  };
}

export default function Dashboard() {
  const [issues, setIssues] = useState<Record<string, IssueState>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [model, setModel] = useState<ModelInfo | null>(null);
  const closers = useRef<Record<string, () => void>>({});
  const analyzed = useRef<Set<string>>(new Set());

  // restore the current issue set on mount (so a page reload still shows them)
  useEffect(() => {
    Promise.all([getModelInfo().then(setModel).catch(() => null),
                 getIssues().then((list) => {
                   const map: Record<string, IssueState> = {};
                   list.forEach((i) => { map[i.id] = toState(i); });
                   setIssues(map);
                 }).catch(() => null)]);
    return () => Object.values(closers.current).forEach((c) => c());
  }, []);

  const patch = useCallback((id: string, fn: (i: IssueState) => IssueState) => {
    setIssues((p) => (p[id] ? { ...p, [id]: fn(p[id]) } : p));
  }, []);

  const startAnalysis = useCallback(async (id: string) => {
    if (analyzed.current.has(id)) return;
    analyzed.current.add(id);
    patch(id, (i) => ({ ...i, analysisStatus: "analyzing" }));
    try {
      const { session } = await analyzeIssue(id);
      patch(id, (i) => ({ ...i, session }));
      closers.current[id] = subscribeAgentStream(session, (ev: AgentEvent) => {
        patch(id, (i) => {
          const next: IssueState = { ...i, agentEvents: [...i.agentEvents, ev] };
          if (ev.cached) next.cached = true;
          if (typeof ev.tokens === "number") next.tokens = i.tokens + ev.tokens;
          if (typeof ev.cost === "number") next.cost = i.cost + ev.cost;
          if (ev.type === "work_order" && ev.wo) next.workOrder = ev.wo;
          if (ev.type === "report") {
            next.report = ev.markdown;
            next.analysisStatus = "diagnosed";
          }
          if (ev.type === "error") next.analysisStatus = "error";
          return next;
        });
      });
    } catch {
      patch(id, (i) => ({ ...i, analysisStatus: "error" }));
    }
  }, [patch]);

  const onRun = useCallback(async () => {
    const list = await runSimulation();
    // close any active streams from a previous batch
    Object.values(closers.current).forEach((c) => c());
    closers.current = {};
    analyzed.current = new Set();
    const map: Record<string, IssueState> = {};
    list.forEach((i) => { map[i.id] = toState(i); });
    setIssues(map);
    setSelected(null);
    // fire the LangGraph analysis for every issue right away; the table flips
    // Analysing -> Diagnosed in real time as each one completes.
    list.forEach((i) => { void startAnalysis(i.id); });
  }, [startAnalysis]);

  const onOpen = useCallback((id: string) => {
    setSelected(id);
  }, []);

  const list = useMemo(() => Object.values(issues), [issues]);
  const active = selected ? issues[selected] : null;

  return (
    <div className="min-h-screen">
      {/* top bar */}
      <header
        className="sticky top-0 z-20 border-b bg-[var(--bg)]/95 backdrop-blur"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span
              className="grid h-6 w-6 place-items-center rounded-[5px] border text-[11px] font-semibold text-[var(--text)]"
              style={{ borderColor: "var(--border-strong)" }}
            >
              OM
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-[15px] font-semibold tracking-tight text-[var(--text)]">
                OvenMind
              </span>
              <span className="text-[12px] text-[var(--faint)]">Operations</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[12px] text-[var(--muted)] sm:inline">
              Predictive maintenance · {list.length} issues open
            </span>
            <RunSimulationButton onRun={onRun} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] space-y-5 px-6 py-6">
        <Panel
          title="Active issues"
          bodyClassName="py-1.5"
          right={
            <span className="mono text-[11px] text-[var(--faint)]">
              {list.length} open
            </span>
          }
        >
          <IssuesList issues={list} onOpen={onOpen} />
        </Panel>

        <p className="text-[11px] text-[var(--faint)]">
          Predictions from the live RandomForest model on the bakery-robotics
          telemetry dataset. Vision model still in training.
        </p>
      </main>

      {active && model && (
        <IncidentDetail issue={active} model={model} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
