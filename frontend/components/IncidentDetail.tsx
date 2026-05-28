"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { AgentEvent, Channel, CVFrame, MLMeta, ScenarioMeta, SensorFrame, WorkOrder } from "@/lib/types";
import { cn } from "@/lib/ui";
import { Pill, SeverityBadge } from "./ui";
import AgentWorkflow from "./AgentWorkflow";
import LLMReport from "./LLMReport";
import VisionPanel from "./VisionPanel";
import PredictivePanel from "./PredictivePanel";

type Tab = "report" | "workflow" | "ml";

export default function IncidentDetail({
  open,
  onClose,
  meta,
  channels,
  sensorFrames,
  cvFrames,
  agentEvents,
  reportMarkdown,
  workOrder,
  ml,
  playhead,
  cached,
  tokens,
  cost,
}: {
  open: boolean;
  onClose: () => void;
  meta: ScenarioMeta;
  channels: Channel[];
  sensorFrames: SensorFrame[];
  cvFrames: CVFrame[];
  agentEvents: AgentEvent[];
  reportMarkdown?: string;
  workOrder?: WorkOrder | null;
  ml?: MLMeta;
  playhead: number;
  cached: boolean;
  tokens: number;
  cost: number;
}) {
  const [tab, setTab] = useState<Tab>("report");
  if (!open) return null;

  const latestCV = cvFrames[cvFrames.length - 1];

  const tabs: { id: Tab; label: string }[] = [
    { id: "report", label: "Report" },
    { id: "workflow", label: "Agent Workflow" },
    { id: "ml", label: "ML Models" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm">
      <div className="fadeup flex h-full w-full max-w-3xl flex-col border-l bg-[var(--bg)]"
        style={{ borderColor: "var(--border)" }}>
        {/* header */}
        <div className="flex items-start justify-between border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[var(--text)]">{meta.title}</h2>
              <SeverityBadge severity={meta.severity} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[var(--muted)]">
              <span>{meta.line} · {meta.equipment_name} ({meta.equipment_id}) · {meta.product}</span>
              {cached ? <Pill className="text-emerald-300">cached run</Pill> : <Pill className="text-[var(--accent)]">live run</Pill>}
              <Pill className="mono text-[var(--muted)]">{tokens} tok · ${cost.toFixed(4)}</Pill>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md border p-1.5 text-[var(--muted)] hover:text-[var(--text)]"
            style={{ borderColor: "var(--border)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* tabs */}
        <div className="flex gap-1 border-b px-3 pt-2" style={{ borderColor: "var(--border)" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-t-md px-3 py-2 text-sm font-medium transition",
                tab === t.id
                  ? "border-b-2 border-[var(--accent)] text-[var(--text)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* body */}
        <div className="scroll-thin flex-1 overflow-y-auto p-5">
          {tab === "report" && <LLMReport markdown={reportMarkdown} workOrder={workOrder} />}
          {tab === "workflow" && <AgentWorkflow events={agentEvents} />}
          {tab === "ml" && (
            <div className="space-y-6">
              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Vision model · {meta.product}
                </h3>
                <VisionPanel
                  image={meta.image}
                  detections={latestCV?.detections ?? []}
                  defectRate={latestCV?.defect_rate}
                  threshold={ml?.conf_threshold ?? 0.5}
                />
              </section>
              {ml && (
                <section>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Predictive maintenance model
                  </h3>
                  <PredictivePanel ml={ml} channels={channels} frames={sensorFrames} playhead={playhead} fireAt={meta.fire_at_t} />
                </section>
              )}
              <p className="text-[11px] text-[var(--muted)]">
                Model outputs shown here are simulated fixture data for the demo; the agent
                reasoning above is produced by real Claude calls over these values.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
