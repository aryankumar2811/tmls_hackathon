"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Wrench } from "lucide-react";
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
  routedFrom?: boolean;
}

function buildSteps(events: AgentEvent[]): Step[] {
  const steps: Step[] = [];
  let cur: Step | null = null;
  for (const e of events) {
    switch (e.type) {
      case "agent_start":
        cur = { agent: e.agent ?? "Agent", role: e.role, model: e.model, status: "running", tools: [] };
        steps.push(cur);
        break;
      case "tool_call":
        if (cur) cur.tools.push({ tool: e.tool ?? "", args: e.args });
        break;
      case "tool_result":
        if (cur) {
          const last = [...cur.tools].reverse().find((t) => t.tool === e.tool && t.result === undefined);
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

export default function AgentWorkflow({ events }: { events: AgentEvent[] }) {
  const steps = useMemo(() => buildSteps(events), [events]);

  if (steps.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <Loader2 className="h-4 w-4 animate-spin" /> Supervisor is dispatching agents…
      </div>
    );
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
  const [open, setOpen] = useState(true);
  const color = AGENT_COLORS[step.agent] ?? "#8a93a3";
  return (
    <li className="fadeup relative">
      <span
        className={cn("absolute -left-[22px] top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full",
          step.status === "running" && "pulse")}
        style={{ background: color }}
      >
        {step.status === "done" ? (
          <Check className="h-3 w-3 text-[#0a0c10]" />
        ) : (
          <Loader2 className="h-3 w-3 animate-spin text-[#0a0c10]" />
        )}
      </span>
      <div className="rounded-lg border bg-[var(--panel-2)] p-3" style={{ borderColor: "var(--border)" }}>
        <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
          <span>
            <span className="text-sm font-semibold" style={{ color }}>{step.agent}</span>
            {step.role && <span className="ml-2 text-[11px] text-[var(--muted)]">{step.role}</span>}
          </span>
          <span className="flex items-center gap-2">
            {step.model && (
              <span className="mono rounded border px-1.5 py-0.5 text-[10px] text-[var(--muted)]"
                style={{ borderColor: "var(--border)" }}>{step.model}</span>
            )}
            {step.tokens ? (
              <span className="mono text-[10px] text-[var(--muted)]">
                {step.tokens} tok · ${step.cost?.toFixed(4)}
              </span>
            ) : null}
          </span>
        </button>

        {open && (
          <div className="mt-2 space-y-2">
            {step.tools.map((t, j) => (
              <div key={j} className="rounded-md border bg-[var(--bg)]/60 p-2" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-1.5 text-[12px]">
                  <Wrench className="h-3 w-3 text-[var(--accent)]" />
                  <span className="mono font-medium text-[var(--text)]">{t.tool}</span>
                  {t.args && Object.keys(t.args).length > 0 && (
                    <span className="mono truncate text-[10px] text-[var(--muted)]">
                      ({JSON.stringify(t.args)})
                    </span>
                  )}
                </div>
                {t.result !== undefined && (
                  <pre className="scroll-thin mono mt-1 max-h-28 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-relaxed text-[var(--muted)]">
                    {typeof t.result === "string" ? t.result : JSON.stringify(t.result, null, 1)}
                  </pre>
                )}
              </div>
            ))}
            {step.summary && (
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text)]/90">
                {step.summary}
              </p>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
