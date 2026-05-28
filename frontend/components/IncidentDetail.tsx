"use client";

import { useState } from "react";
import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentEvent, Incident } from "@/lib/types";
import { cn, relTime, SEVERITY, usd } from "@/lib/ui";
import { Metric, SeverityBadge, StatusBadge } from "./ui";
import AgentWorkflow from "./AgentWorkflow";
import VisionPanel from "./VisionPanel";
import PredictivePanel from "./PredictivePanel";

type Tab = "overview" | "report" | "raw";

function currentFailureProb(inc: Incident): number {
  const c = inc.ml.failure_probability ?? [];
  return [...c].reverse().find((p) => p.t <= inc.playhead)?.p ?? c[c.length - 1]?.p ?? 0;
}

function correlationConfidence(events: AgentEvent[]): number | null {
  for (const e of events) {
    if (e.type === "tool_result" && e.tool === "compute_correlation") {
      const r = e.result as { common_root_cause_probability?: number } | undefined;
      if (r?.common_root_cause_probability != null) return r.common_root_cause_probability;
    }
  }
  return null;
}

function fallbackReport(inc: Incident): string {
  const latest = inc.cvFrames[inc.cvFrames.length - 1];
  const rate = latest?.defect_rate ?? inc.ml.defect_peak_rate;
  const fold = (rate / inc.ml.baseline_rate).toFixed(0);
  const [lo, hi] = inc.groundTruth.impact_usd;
  const wo = inc.workOrder;
  return [
    `## Summary`,
    `${inc.meta.equipment_name} (${inc.meta.equipment_id}) on ${inc.meta.line} shows an equipment anomaly correlated with a rising **${inc.meta.product}** defect rate on the vision line. Likely a single common root cause.`,
    `## What the data shows`,
    `- Predictive model failure probability: **${Math.round(currentFailureProb(inc) * 100)}%**, RUL ${inc.ml.rul_hours[0]}–${inc.ml.rul_hours[1]} h.`,
    `- Vision defect rate **${rate.toFixed(1)}%** vs ${inc.ml.baseline_rate}% baseline (~${fold}×).`,
    `- Leading feature: **${Object.entries(inc.ml.feature_contributions).sort((a, b) => b[1] - a[1])[0]?.[0]}**.`,
    `## Root cause`,
    `${inc.groundTruth.root_cause} Matches historical incident **${inc.groundTruth.matched_incident}**.`,
    `## Recommended action`,
    wo
      ? `Open work order **${wo.wo_id}** — parts: ${wo.parts.join(", ")}; technician ${wo.technician}; ETA ${wo.eta_hours} h; estimated impact ${usd(lo)}–${usd(hi)} if not actioned.`
      : `Dispatch maintenance for ${inc.meta.equipment_id}; estimated impact ${usd(lo)}–${usd(hi)} if not actioned.`,
  ].join("\n\n");
}

export default function IncidentDetail({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const sev = SEVERITY[incident.meta.severity];
  const latestCV = incident.cvFrames[incident.cvFrames.length - 1];
  const corr = correlationConfidence(incident.agentEvents);
  const failP = currentFailureProb(incident);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "report", label: "Agent report" },
    { id: "raw", label: "Raw ML output" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-3xl flex-col border-l bg-[var(--bg)]"
        style={{ borderColor: "var(--border-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="truncate text-[17px] font-semibold text-[var(--text)]">{incident.meta.title}</h2>
              <SeverityBadge severity={incident.meta.severity} />
              <StatusBadge tone={incident.status === "diagnosed" ? "diagnosed" : "investigating"}>
                {incident.status === "diagnosed" ? "Diagnosed" : "Investigating"}
              </StatusBadge>
            </div>
            <div className="mono mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[var(--faint)]">
              <span>{incident.meta.line}</span><span>·</span>
              <span>{incident.meta.equipment_name} ({incident.meta.equipment_id})</span><span>·</span>
              <span>detected {relTime(incident.detectedAt)}</span><span>·</span>
              <span>{incident.cached ? "cached" : "live"} · {incident.tokens} tok · ${incident.cost.toFixed(4)}</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md border p-1.5 text-[var(--muted)] hover:text-[var(--text)]"
            style={{ borderColor: "var(--border)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* tabs */}
        <div className="flex gap-5 border-b px-6" style={{ borderColor: "var(--border)" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("relative -mb-px py-2.5 text-[13px] font-medium transition-colors",
                tab === t.id ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]")}>
              {t.label}
              {tab === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5" style={{ background: sev.color }} />}
            </button>
          ))}
        </div>

        {/* body */}
        <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">
          {tab === "overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                <Metric label="Failure prob." value={`${Math.round(failP * 100)}%`}
                  color={failP > 0.7 ? "var(--critical)" : failP > 0.4 ? "var(--high)" : "var(--text)"} />
                <Metric label="Remaining life" value={`${incident.ml.rul_hours[0]}–${incident.ml.rul_hours[1]}h`} />
                <Metric label="Defect rate" value={latestCV ? `${latestCV.defect_rate.toFixed(1)}%` : "—"}
                  sub={`baseline ${incident.ml.baseline_rate}%`} />
                <Metric label="Common cause" value={corr != null ? `${Math.round(corr * 100)}%` : "—"}
                  sub="cross-modal" color={corr != null ? "var(--ok)" : undefined} />
              </div>

              <Card title="Diagnosis">
                <p className="text-[13.5px] leading-relaxed text-[var(--text)]/90">{incident.groundTruth.root_cause}</p>
                <p className="mt-2 text-[12px] text-[var(--muted)]">
                  Matched historical incident{" "}
                  <span className="mono text-[var(--text)]">{incident.groundTruth.matched_incident}</span>.
                </p>
              </Card>

              <Card title="Recommended action">
                {incident.workOrder ? <WorkOrderCard wo={incident.workOrder} /> : (
                  <p className="text-[13px] text-[var(--muted)]">
                    Work order is being prepared by the agent…
                  </p>
                )}
              </Card>
            </div>
          )}

          {tab === "report" && (
            <div className="space-y-5">
              <article className="max-w-none text-[13.5px] leading-relaxed text-[var(--text)]/90
                [&_h2]:mb-1 [&_h2]:mt-4 [&_h2]:text-[11px] [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-[0.12em] [&_h2]:text-[var(--muted)]
                [&_strong]:text-[var(--text)] [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5
                [&_p]:my-1.5 [&_code]:mono [&_code]:rounded [&_code]:bg-[var(--surface-2)] [&_code]:px-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {incident.report || fallbackReport(incident)}
                </ReactMarkdown>
              </article>
              {!incident.report && (
                <p className="text-[11px] text-[var(--faint)]">
                  Showing a generated summary; the agent report streams in once analysis completes
                  (requires ANTHROPIC_API_KEY).
                </p>
              )}
              {incident.agentEvents.some((e) => e.type === "agent_start") && (
                <Card title="Reasoning trace">
                  <AgentWorkflow events={incident.agentEvents} />
                </Card>
              )}
            </div>
          )}

          {tab === "raw" && (
            <div className="space-y-6">
              <section>
                <SectionLabel>Vision model · {incident.meta.product}</SectionLabel>
                <VisionPanel detections={latestCV?.detections ?? []} defectRate={latestCV?.defect_rate}
                  caption={`${incident.meta.line} · ${incident.meta.product}`} />
                <DetectionsTable detections={latestCV?.detections ?? []} />
              </section>
              <section>
                <SectionLabel>Predictive maintenance model</SectionLabel>
                <PredictivePanel ml={incident.ml} channels={incident.channels}
                  frames={incident.sensorFrames} playhead={incident.playhead} fireAt={incident.meta.fire_at_t} />
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-[var(--surface)] p-4" style={{ borderColor: "var(--border)" }}>
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">{title}</div>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">{children}</h3>;
}

function WorkOrderCard({ wo }: { wo: NonNullable<Incident["workOrder"]> }) {
  const rows: [string, string][] = [
    ["Work order", wo.wo_id],
    ["Parts", wo.parts.join(", ")],
    ["Technician", wo.technician],
    ["ETA", `${wo.eta_hours} h`],
    ["Est. impact", `${usd(wo.estimated_impact_usd[0])}–${usd(wo.estimated_impact_usd[1])}`],
  ];
  return (
    <dl className="grid grid-cols-[120px_1fr] gap-y-1.5 text-[12.5px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-[var(--muted)]">{k}</dt>
          <dd className="mono text-[var(--text)]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function DetectionsTable({ detections }: { detections: { label: string; confidence: number; bbox: number[] }[] }) {
  if (detections.length === 0) return null;
  return (
    <table className="mono mt-2 w-full text-[11px]">
      <thead>
        <tr className="text-left text-[var(--faint)]">
          <th className="py-1 font-normal">class</th>
          <th className="py-1 font-normal">conf</th>
          <th className="py-1 font-normal">bbox [x y w h]</th>
        </tr>
      </thead>
      <tbody>
        {detections.map((d, i) => (
          <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
            <td className="py-1" style={{ color: d.label === "good" ? "var(--ok)" : "var(--critical)" }}>{d.label}</td>
            <td className="py-1 text-[var(--text)]">{(d.confidence * 100).toFixed(1)}%</td>
            <td className="py-1 text-[var(--muted)]">[{d.bbox.map((n) => n.toFixed(2)).join(" ")}]</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
