"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Wrench } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentEvent } from "@/lib/types";
import { AGENT_COLORS, cn } from "@/lib/ui";

interface ToolCall {
  tool: string;
  args?: Record<string, unknown>;
  result?: unknown;
}
interface Step {
  agent: string;
  role?: string;
  model?: string;
  status: "running" | "done";
  tools: ToolCall[];
  summary?: string;
  tokens?: number;
  cost?: number;
}

function buildSteps(events: AgentEvent[]): Step[] {
  const steps: Step[] = [];
  let cur: Step | null = null;
  for (const e of events) {
    switch (e.type) {
      case "agent_start":
        cur = {
          agent: e.agent ?? "Agent",
          role: e.role,
          model: e.model,
          status: "running",
          tools: [],
        };
        steps.push(cur);
        break;
      case "tool_call":
        if (cur) cur.tools.push({ tool: e.tool ?? "", args: e.args });
        break;
      case "tool_result":
        if (cur) {
          const last = [...cur.tools].reverse().find(
            (t) => t.tool === e.tool && t.result === undefined,
          );
          if (last) last.result = e.result;
        }
        break;
      case "agent_done":
        if (cur) {
          cur.status = "done";
          cur.summary = e.summary;
          cur.tokens = e.tokens;
          cur.cost = e.cost;
        }
        break;
    }
  }
  return steps;
}

const PROSE_CLASSES =
  "max-w-none text-[13px] leading-relaxed text-[var(--text)]/90 " +
  "[&_h1]:mb-1 [&_h1]:mt-3 [&_h1]:text-[14px] [&_h1]:font-semibold [&_h1]:text-[var(--text)] " +
  "[&_h2]:mb-1 [&_h2]:mt-3 [&_h2]:text-[11px] [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-[0.12em] [&_h2]:text-[var(--muted)] " +
  "[&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-[12px] [&_h3]:font-semibold [&_h3]:text-[var(--text)] " +
  "[&_strong]:text-[var(--text)] " +
  "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 " +
  "[&_p]:my-1.5 " +
  "[&_code]:mono [&_code]:rounded [&_code]:bg-[var(--surface-2)] [&_code]:px-1 [&_code]:text-[12px] " +
  "[&_table]:mono [&_table]:my-2 [&_table]:w-full [&_table]:text-[11.5px] [&_table]:border-collapse " +
  "[&_th]:border-b [&_th]:border-[var(--border)] [&_th]:py-1 [&_th]:pr-3 [&_th]:text-left [&_th]:font-medium [&_th]:text-[var(--muted)] " +
  "[&_td]:border-b [&_td]:border-[var(--border)]/40 [&_td]:py-1 [&_td]:pr-3 [&_td]:align-top " +
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--border-strong)] [&_blockquote]:pl-3 [&_blockquote]:text-[var(--muted)]";

export default function AgentWorkflow({ events }: { events: AgentEvent[] }) {
  const steps = useMemo(() => buildSteps(events), [events]);

  if (steps.length === 0) {
    return <div className="text-[13px] text-[var(--muted)]">Supervisor is dispatching agents…</div>;
  }

  return (
    <ol className="relative space-y-3 pl-6">
      <span className="absolute bottom-2 left-[9px] top-2 w-px bg-[var(--border)]" />
      {steps.map((s, i) => (
        <StepCard key={i} step={s} />
      ))}
    </ol>
  );
}

function StepCard({ step }: { step: Step }) {
  const color = AGENT_COLORS[step.agent] ?? "#8a9099";
  return (
    <li className="relative">
      <span
        className="absolute -left-[22px] top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full"
        style={{
          background: step.status === "done" ? color : "var(--surface-2)",
          border: `1px solid ${color}`,
        }}
      >
        {step.status === "done" && <Check className="h-3 w-3 text-[#0b0d10]" />}
      </span>
      <div className="rounded-md border bg-[var(--surface-2)] p-3" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold" style={{ color }}>{step.agent}</div>
            {step.role && (
              <div className="mt-0.5 text-[11px] text-[var(--muted)]">{step.role}</div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {step.model && (
              <span
                className="mono rounded border px-1.5 py-0.5 text-[10px] text-[var(--muted)]"
                style={{ borderColor: "var(--border)" }}
              >
                {step.model}
              </span>
            )}
            {step.tokens != null && step.tokens > 0 && (
              <span className="mono text-[10px] text-[var(--muted)]">
                {step.tokens} tok · ${step.cost?.toFixed(4) ?? "0.0000"}
              </span>
            )}
          </div>
        </div>

        {step.tools.length > 0 && (
          <div className="mt-2.5 space-y-1">
            {step.tools.map((t, j) => (
              <ToolRow key={j} tool={t} />
            ))}
          </div>
        )}

        {step.summary && (
          <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
            <div className={PROSE_CLASSES}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.summary}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function ToolRow({ tool }: { tool: ToolCall }) {
  const [open, setOpen] = useState(false);
  const hasDetail =
    (tool.args && Object.keys(tool.args).length > 0) || tool.result !== undefined;
  return (
    <div
      className="rounded-[3px] border"
      style={{ borderColor: "var(--border)", background: "var(--bg)" }}
    >
      <button
        onClick={() => hasDetail && setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-1.5 px-2 py-1.5 text-left",
          hasDetail && "hover:bg-[var(--surface-2)]",
        )}
      >
        <Wrench className="h-3 w-3 shrink-0 text-[var(--muted)]" />
        <span className="mono text-[11.5px] font-medium text-[var(--text)]">{tool.tool}</span>
        <span className="mono text-[10.5px] text-[var(--faint)]">
          {summarizeCall(tool)}
        </span>
        {hasDetail && (
          <span className="ml-auto text-[var(--faint)]">
            {open ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
        )}
      </button>
      {open && hasDetail && (
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          {tool.args && Object.keys(tool.args).length > 0 && (
            <DetailBlock label="args" value={tool.args} />
          )}
          {tool.result !== undefined && <DetailBlock label="result" value={tool.result} />}
        </div>
      )}
    </div>
  );
}

function summarizeCall(t: ToolCall): string {
  const r = t.result;
  if (r && typeof r === "object" && !Array.isArray(r)) {
    const rec = r as Record<string, unknown>;
    // pick a couple of representative fields if present
    const keys = Object.keys(rec).slice(0, 2);
    const parts = keys
      .map((k) => {
        const v = rec[k];
        if (v == null) return null;
        if (typeof v === "object") return null;
        return `${k}=${String(v).slice(0, 30)}`;
      })
      .filter(Boolean);
    if (parts.length) return parts.join(" · ");
    return `${Object.keys(rec).length} fields`;
  }
  if (Array.isArray(r)) return `${r.length} items`;
  if (typeof r === "string") return r.slice(0, 60);
  return "";
}

function DetailBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="px-2 py-1.5">
      <div className="mono mb-1 text-[10px] uppercase tracking-wider text-[var(--faint)]">
        {label}
      </div>
      <pre className="scroll-thin mono max-h-48 overflow-auto whitespace-pre-wrap break-words text-[10.5px] leading-relaxed text-[var(--muted)]">
        {typeof value === "string" ? value : JSON.stringify(value, null, 1)}
      </pre>
    </div>
  );
}
