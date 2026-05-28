"use client";

import { ChevronRight } from "lucide-react";
import type { Incident } from "@/lib/types";
import { relTime, SEVERITY } from "@/lib/ui";
import { SeverityBadge, StatusBadge } from "./ui";

const RANK = { critical: 0, high: 1, medium: 2, low: 3 };

export default function IssuesList({
  incidents,
  onOpen,
}: {
  incidents: Incident[];
  onOpen: (id: string) => void;
}) {
  if (incidents.length === 0) {
    return (
      <div className="flex h-44 flex-col items-center justify-center gap-1.5 text-center">
        <div className="h-2 w-2 rounded-full" style={{ background: "var(--ok)" }} />
        <p className="text-[13px] text-[var(--muted)]">No active issues</p>
        <p className="text-[11px] text-[var(--faint)]">
          All monitored lines are operating within nominal parameters.
        </p>
      </div>
    );
  }

  const sorted = [...incidents].sort(
    (a, b) => RANK[a.meta.severity] - RANK[b.meta.severity] || b.detectedAt - a.detectedAt,
  );

  return (
    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
      {sorted.map((inc) => (
        <button
          key={inc.session}
          onClick={() => onOpen(inc.session)}
          className="group flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-[var(--surface-2)]"
        >
          <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: SEVERITY[inc.meta.severity].color }} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="mono text-[11px] text-[var(--faint)]">{inc.meta.equipment_id}</span>
              <span className="truncate text-[13.5px] font-medium text-[var(--text)]">{inc.meta.title}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--muted)]">
              <span>{inc.meta.line}</span>
              <span className="text-[var(--faint)]">·</span>
              <span>{relTime(inc.detectedAt)}</span>
            </div>
          </div>
          <SeverityBadge severity={inc.meta.severity} small />
          <StatusBadge tone={inc.status === "diagnosed" ? "diagnosed" : "investigating"}>
            {inc.status === "diagnosed" ? "Diagnosed" : "Investigating"}
          </StatusBadge>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--faint)] group-hover:text-[var(--muted)]" />
        </button>
      ))}
    </div>
  );
}
