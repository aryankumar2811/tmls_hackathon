"use client";

import { ChevronRight } from "lucide-react";
import type { IssueState } from "@/lib/types";
import { relTime, SEVERITY } from "@/lib/ui";
import { SeverityBadge, StatusBadge } from "./ui";

const RANK = { critical: 0, medium: 1, low: 2 };

function statusTone(s: IssueState["analysisStatus"]): "investigating" | "diagnosed" | "neutral" {
  if (s === "diagnosed") return "diagnosed";
  if (s === "analyzing") return "investigating";
  return "neutral";
}

function statusLabel(s: IssueState["analysisStatus"]): string {
  return s === "diagnosed" ? "Diagnosed"
    : s === "analyzing" ? "Analyzing"
    : s === "error" ? "Analysis error"
    : "Pending";
}

export default function IssuesList({
  issues,
  onOpen,
}: {
  issues: IssueState[];
  onOpen: (id: string) => void;
}) {
  if (issues.length === 0) {
    return (
      <div className="flex h-44 flex-col items-center justify-center gap-1.5 text-center">
        <p className="text-[13px] text-[var(--muted)]">No active issues</p>
        <p className="text-[11px] text-[var(--faint)]">
          Press Run simulation to ingest a batch of equipment telemetry.
        </p>
      </div>
    );
  }

  const sorted = [...issues].sort(
    (a, b) => RANK[a.severity] - RANK[b.severity] || b.detectedAt - a.detectedAt,
  );

  return (
    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
      {sorted.map((inc) => (
        <button
          key={inc.id}
          onClick={() => onOpen(inc.id)}
          className="group flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-[var(--surface-2)]"
        >
          <span
            className="h-8 w-1 shrink-0 rounded-full"
            style={{ background: SEVERITY[inc.severity].color }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="mono text-[11px] text-[var(--faint)]">
                {inc.id} · {inc.equipment_id}
              </span>
              <span className="truncate text-[13.5px] font-medium text-[var(--text)]">
                {inc.title}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--muted)]">
              <span>{inc.plant}</span>
              <span className="text-[var(--faint)]">·</span>
              <span>{inc.machine_type}</span>
              <span className="text-[var(--faint)]">·</span>
              <span>{relTime(inc.detectedAt)}</span>
            </div>
          </div>
          <SeverityBadge severity={inc.severity} small />
          <StatusBadge tone={statusTone(inc.analysisStatus)}>
            {statusLabel(inc.analysisStatus)}
          </StatusBadge>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--faint)] group-hover:text-[var(--muted)]" />
        </button>
      ))}
    </div>
  );
}
