"use client";

import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { WorkOrder } from "@/lib/types";
import { SeverityBadge } from "./ui";
import { usd } from "@/lib/ui";

export default function LLMReport({
  markdown,
  workOrder,
}: {
  markdown?: string;
  workOrder?: WorkOrder | null;
}) {
  if (!markdown) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Loader2 className="h-4 w-4 animate-spin" /> Reporting Agent is composing the incident report…
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <article className="prose-invert max-w-none text-[13.5px] leading-relaxed text-[var(--text)]/90
        [&_h2]:mt-4 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-[var(--accent)]
        [&_h3]:mt-3 [&_h3]:text-[13px] [&_h3]:font-semibold
        [&_strong]:text-[var(--text)] [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5
        [&_p]:my-2 [&_code]:rounded [&_code]:bg-[var(--panel-2)] [&_code]:px-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </article>

      {workOrder && (
        <div className="rounded-lg border bg-[var(--panel-2)] p-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <span className="mono text-sm font-semibold text-[var(--text)]">{workOrder.wo_id}</span>
            <SeverityBadge severity={workOrder.severity} />
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
            <Row k="Equipment" v={`${workOrder.equipment_name} (${workOrder.equipment_id})`} />
            <Row k="Technician" v={workOrder.technician} />
            <Row k="ETA" v={`${workOrder.eta_hours} h`} />
            <Row k="Impact" v={`${usd(workOrder.estimated_impact_usd[0])}–${usd(workOrder.estimated_impact_usd[1])}`} />
            <Row k="Parts" v={workOrder.parts.join(", ")} />
            <Row k="Matched incident" v={workOrder.matched_incident ?? "—"} />
          </dl>
          <div className="mt-2 flex gap-2 text-[11px] text-[var(--muted)]">
            <span>{workOrder.pdf?.ok ? "📄 PDF generated" : "📄 PDF skipped"}</span>
            <span>{workOrder.slack?.posted ? "💬 posted to Slack" : "💬 Slack not configured"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-[var(--muted)]">{k}</dt>
      <dd className="text-right text-[var(--text)]">{v}</dd>
    </>
  );
}
