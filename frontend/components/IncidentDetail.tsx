"use client";

import { useState } from "react";
import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { IssueState, ModelInfo } from "@/lib/types";
import { cn, relTime, SEVERITY, usd } from "@/lib/ui";
import { Metric, SeverityBadge, StatusBadge } from "./ui";
import ClassProbabilityBar from "./ClassProbabilityBar";
import FeatureValuesTable from "./FeatureValuesTable";
import VisionPlaceholder from "./VisionPlaceholder";
import AgentWorkflow from "./AgentWorkflow";

type Tab = "overview" | "report" | "raw";

function prettyFeature(n: string): string {
  return n.replace(/_/g, " ").replace(/Pct/g, "%").replace(/mm s/g, "mm/s");
}

function fallbackReport(i: IssueState, model: ModelInfo): string {
  const top = i.prediction.top_features
    .map((n) => {
      const v = i.features[n];
      const b = model.baselines[n];
      const unit = model.units[n] ?? "";
      if (typeof v !== "number" || typeof b !== "number" || b === 0)
        return `- ${prettyFeature(n)}: ${String(v ?? "—")}`;
      const pct = (((v - b) / b) * 100).toFixed(0);
      return `- ${prettyFeature(n)}: **${v}${unit}** (baseline ${b}${unit}, ${pct}% vs baseline)`;
    })
    .join("\n");
  const probs = i.prediction.probabilities;
  const dr = i.features.Defect_Rate_Pct;
  const dc = i.features.Defect_Count;
  const action = i.context.corrective_action ?? "Dispatch maintenance per SOP.";
  return [
    `## Summary`,
    `${i.machine_name} (${i.equipment_id}) on ${i.line} at ${i.plant} predicted **${i.severity}** severity by the model (P(critical) = ${(probs[2] * 100).toFixed(1)}%).`,
    `## What the data shows`,
    top,
    `- Quality signal (defect-count sensor): **${dc ?? "—"}** units, **${dr ?? "—"}%** rate. Vision model pending.`,
    `## Root cause`,
    `${i.context.ground_truth_description ?? "Equipment anomaly correlated with elevated quality-signal readings on the same record."}`,
    i.context.error_code
      ? `Recent controller event: ${i.context.error_code} — ${i.context.error_description ?? ""}.`
      : "",
    `## Recommended action`,
    i.workOrder
      ? `Open work order **${i.workOrder.wo_id}** — parts: ${i.workOrder.parts.join(", ")}; technician ${i.workOrder.technician}; ETA ${i.workOrder.eta_hours} h; estimated impact ${usd(i.workOrder.estimated_impact_usd[0])}–${usd(i.workOrder.estimated_impact_usd[1])}.`
      : action,
  ].filter(Boolean).join("\n\n");
}

export default function IncidentDetail({
  issue,
  model,
  onClose,
}: {
  issue: IssueState;
  model: ModelInfo;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const sev = SEVERITY[issue.severity];

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "report", label: "Agent report" },
    { id: "raw", label: "Raw ML output" },
  ];

  const probs = issue.prediction.probabilities;
  const featCount = issue.features.Defect_Count;
  const featRate = issue.features.Defect_Rate_Pct;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-3xl flex-col border-l bg-[var(--bg)]"
        style={{ borderColor: "var(--border-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div
          className="flex items-start justify-between border-b px-6 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="truncate text-[17px] font-semibold text-[var(--text)]">
                {issue.title}
              </h2>
              <SeverityBadge severity={issue.severity} />
              <StatusBadge
                tone={
                  issue.analysisStatus === "diagnosed"
                    ? "diagnosed"
                    : issue.analysisStatus === "analyzing"
                    ? "investigating"
                    : "neutral"
                }
              >
                {issue.analysisStatus === "diagnosed"
                  ? "Diagnosed"
                  : issue.analysisStatus === "analyzing"
                  ? "Analyzing"
                  : issue.analysisStatus === "error"
                  ? "Analysis error"
                  : "Pending"}
              </StatusBadge>
            </div>
            <div className="mono mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[var(--faint)]">
              <span>{issue.id}</span>
              <span>·</span>
              <span>{issue.equipment_id}</span>
              <span>·</span>
              <span>{issue.plant}</span>
              <span>·</span>
              <span>{issue.machine_type}</span>
              <span>·</span>
              <span>detected {relTime(issue.detectedAt)}</span>
              {(issue.tokens > 0 || issue.cached) && (
                <>
                  <span>·</span>
                  <span>
                    {issue.cached ? "cached" : "live"} · {issue.tokens} tok · $
                    {issue.cost.toFixed(4)}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border p-1.5 text-[var(--muted)] hover:text-[var(--text)]"
            style={{ borderColor: "var(--border)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* tabs */}
        <div className="flex gap-5 border-b px-6" style={{ borderColor: "var(--border)" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative -mb-px py-2.5 text-[13px] font-medium transition-colors",
                tab === t.id
                  ? "text-[var(--text)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]",
              )}
            >
              {t.label}
              {tab === t.id && (
                <span
                  className="absolute inset-x-0 -bottom-px h-0.5"
                  style={{ background: sev.color }}
                />
              )}
            </button>
          ))}
        </div>

        {/* body */}
        <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">
          {tab === "overview" && (
            <div className="space-y-5">
              <Card title="Equipment">
                <dl className="grid grid-cols-[120px_1fr] gap-y-1.5 text-[12.5px]">
                  <Row k="Machine" v={`${issue.machine_name} (${issue.machine_type})`} />
                  <Row k="Manufacturer" v={issue.manufacturer} />
                  <Row k="Line / plant" v={`${issue.line} · ${issue.plant}`} />
                  {issue.product && <Row k="Product" v={issue.product} />}
                  {issue.context.error_code && (
                    <Row
                      k="Controller event"
                      v={`${issue.context.error_code} — ${issue.context.error_description ?? ""}`}
                    />
                  )}
                  {issue.context.last_maintenance_date && (
                    <Row
                      k="Last maintenance"
                      v={`${issue.context.last_maintenance_date} (${issue.context.maintenance_type ?? "—"})`}
                    />
                  )}
                  {issue.context.operator_id && (
                    <Row k="Operator / shift" v={`${issue.context.operator_id} · ${issue.context.shift ?? ""}`} />
                  )}
                </dl>
              </Card>

              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                <Metric
                  label="Predicted severity"
                  value={issue.severity.replace(/^./, (c) => c.toUpperCase())}
                  color={sev.color}
                />
                <Metric label="P(critical)" value={`${(probs[2] * 100).toFixed(1)}%`} />
                <Metric label="Defect rate" value={featRate != null ? `${featRate}%` : "—"} />
                <Metric label="Defect count" value={featCount ?? "—"} />
              </div>

              <Card title="Diagnosis">
                {issue.workOrder ? (
                  <WorkOrderCard wo={issue.workOrder} />
                ) : (
                  <div className="space-y-2">
                    <p className="text-[13px] text-[var(--text)]/90">
                      {issue.context.ground_truth_description ??
                        "Awaiting agent analysis."}
                    </p>
                    {issue.context.corrective_action && (
                      <p className="text-[12px] text-[var(--muted)]">
                        Suggested action (from records):{" "}
                        <span className="text-[var(--text)]/90">
                          {issue.context.corrective_action}
                        </span>
                      </p>
                    )}
                    <p className="text-[11px] text-[var(--faint)]">
                      Open the Agent report tab to run the LangGraph analysis.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {tab === "report" && (
            <div className="space-y-5">
              <ReportBody issue={issue} model={model} />
              {(issue.agentEvents.some((e) => e.type === "agent_start") ||
                issue.analysisStatus === "analyzing") && (
                <Card title="Reasoning trace">
                  <AgentWorkflow events={issue.agentEvents} />
                </Card>
              )}
            </div>
          )}

          {tab === "raw" && (
            <div className="space-y-6">
              <section>
                <SectionLabel>Predictive model — RandomForest</SectionLabel>
                <ClassProbabilityBar
                  probabilities={probs as [number, number, number]}
                  predicted={issue.prediction.class}
                />
              </section>

              <section>
                <SectionLabel>Feature values vs typical baselines</SectionLabel>
                <FeatureValuesTable features={issue.features} model={model} />
                <p className="mono mt-2 text-[11px] text-[var(--faint)]">
                  Sensor_Status: {(issue.features.Sensor_Status as string) || "—"}
                </p>
              </section>

              <section>
                <SectionLabel>Vision model</SectionLabel>
                <VisionPlaceholder
                  defectCount={featCount as number | null | undefined}
                  defectRatePct={featRate as number | null | undefined}
                />
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const REPORT_PROSE =
  "max-w-none text-[13.5px] leading-relaxed text-[var(--text)]/90 " +
  "[&_h2]:mb-1 [&_h2]:mt-4 [&_h2]:text-[11px] [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-[0.12em] [&_h2]:text-[var(--muted)] " +
  "[&_strong]:text-[var(--text)] [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 " +
  "[&_p]:my-1.5 [&_code]:mono [&_code]:rounded [&_code]:bg-[var(--surface-2)] [&_code]:px-1 " +
  "[&_table]:mono [&_table]:my-2 [&_table]:w-full [&_table]:text-[12px] [&_table]:border-collapse " +
  "[&_th]:border-b [&_th]:border-[var(--border)] [&_th]:py-1 [&_th]:pr-3 [&_th]:text-left [&_th]:font-medium [&_th]:text-[var(--muted)] " +
  "[&_td]:border-b [&_td]:border-[var(--border)]/40 [&_td]:py-1 [&_td]:pr-3 [&_td]:align-top";

const AGENT_SEQUENCE = [
  "Equipment Agent",
  "Quality Agent",
  "Correlation Agent",
  "Work-Order Agent",
  "Reporting Agent",
] as const;

function ReportBody({ issue, model }: { issue: IssueState; model: ModelInfo }) {
  // diagnosed: real report
  if (issue.analysisStatus === "diagnosed" && issue.report) {
    return (
      <article className={REPORT_PROSE}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{issue.report}</ReactMarkdown>
      </article>
    );
  }

  // analyzing: progress chips, no fallback yet
  if (issue.analysisStatus === "analyzing") {
    const done = new Set(
      issue.agentEvents
        .filter((e) => e.type === "agent_done" && e.agent)
        .map((e) => e.agent as string),
    );
    const running = issue.agentEvents
      .filter((e) => e.type === "agent_start" && e.agent && !done.has(e.agent))
      .map((e) => e.agent as string)
      .pop();
    return (
      <div className="space-y-3">
        <div
          className="rounded-md border bg-[var(--surface)] p-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--text)]">
            <Spinner /> Analysing — agents running…
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {AGENT_SEQUENCE.map((a) => {
              const isDone = done.has(a);
              const isRunning = !isDone && a === running;
              return (
                <span
                  key={a}
                  className="rounded border px-2 py-0.5 text-[11px]"
                  style={{
                    color: isDone
                      ? "var(--ok)"
                      : isRunning
                      ? "var(--text)"
                      : "var(--faint)",
                    borderColor: isDone
                      ? "var(--ok)55"
                      : isRunning
                      ? "var(--border-strong)"
                      : "var(--border)",
                    background: isRunning ? "var(--surface-2)" : "transparent",
                  }}
                >
                  {isDone ? "✓ " : isRunning ? "● " : ""}
                  {a}
                </span>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-[var(--faint)]">
            Streaming live from LangGraph. The report appears here when the Reporting
            Agent finishes; the reasoning trace below shows each step as it completes.
          </p>
        </div>
      </div>
    );
  }

  // error
  if (issue.analysisStatus === "error") {
    return (
      <div className="space-y-3">
        <div
          className="rounded-md border p-4 text-[12.5px]"
          style={{
            borderColor: "var(--critical)55",
            background: "var(--critical)10",
            color: "var(--critical)",
          }}
        >
          The agent analysis failed (check ANTHROPIC_API_KEY and the backend log).
          Showing a generated summary below.
        </div>
        <article className={REPORT_PROSE}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {fallbackReport(issue, model)}
          </ReactMarkdown>
        </article>
      </div>
    );
  }

  // idle: show the templated fallback with a clear "not analysed yet" notice
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[var(--faint)]">
        Showing a generated summary; the agent report appears here once the LangGraph
        analysis runs (requires ANTHROPIC_API_KEY).
      </p>
      <article className={REPORT_PROSE}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {fallbackReport(issue, model)}
        </ReactMarkdown>
      </article>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
      style={{ color: "var(--text)" }}
    />
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-[var(--surface)] p-4" style={{ borderColor: "var(--border)" }}>
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
        {title}
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
      {children}
    </h3>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="contents">
      <dt className="text-[var(--muted)]">{k}</dt>
      <dd className="text-[var(--text)]">{v}</dd>
    </div>
  );
}

function WorkOrderCard({ wo }: { wo: NonNullable<IssueState["workOrder"]> }) {
  const rows: [string, string][] = [
    ["Work order", wo.wo_id],
    ["Root cause", wo.root_cause],
    ["Parts", wo.parts.join(", ")],
    ["Technician", wo.technician],
    ["ETA", `${wo.eta_hours} h`],
    [
      "Est. impact",
      `${usd(wo.estimated_impact_usd[0])}–${usd(wo.estimated_impact_usd[1])}`,
    ],
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
