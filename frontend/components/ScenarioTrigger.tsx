"use client";

import type { ScenarioMeta } from "@/lib/types";
import { cn, SEVERITY } from "@/lib/ui";

export default function ScenarioTrigger({
  scenarios,
  activeId,
  disabled,
  onTrigger,
}: {
  scenarios: ScenarioMeta[];
  activeId?: string;
  disabled?: boolean;
  onTrigger: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {scenarios.map((s) => {
        const sev = SEVERITY[s.severity];
        const active = s.id === activeId;
        return (
          <button
            key={s.id}
            disabled={disabled}
            onClick={() => onTrigger(s.id)}
            className={cn(
              "group rounded-lg border px-3 py-2.5 text-left transition",
              "bg-[var(--panel-2)] hover:border-[var(--accent)]/60 hover:bg-[var(--panel)]",
              active && "border-[var(--accent)]/70 ring-1 ring-[var(--accent)]/40",
              disabled && "cursor-not-allowed opacity-50",
            )}
            style={{ borderColor: active ? undefined : "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text)]">{s.line}</span>
              <span className={cn("h-2 w-2 rounded-full", sev.dot)} />
            </div>
            <div className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--text)]">
              {s.title}
            </div>
            <div className="mt-1 text-[11px] text-[var(--muted)]">
              {s.equipment_id} · {s.product}
            </div>
          </button>
        );
      })}
    </div>
  );
}
