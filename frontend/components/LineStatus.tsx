"use client";

import type { Incident } from "@/lib/types";
import { SEVERITY } from "@/lib/ui";

interface Line {
  line: string;
  equipment_id: string;
}

const STATUS_WORD: Record<string, string> = {
  critical: "Critical",
  high: "Warning",
  medium: "Watch",
  low: "Watch",
};

export default function LineStatus({
  lines,
  incidents,
}: {
  lines: Line[];
  incidents: Incident[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-5">
      {lines.map((l) => {
        const inc = incidents.find((i) => i.meta.line === l.line);
        const color = inc ? SEVERITY[inc.meta.severity].color : "var(--ok)";
        const word = inc ? STATUS_WORD[inc.meta.severity] : "Operational";
        return (
          <div
            key={l.line}
            className="rounded-md border bg-[var(--surface)] px-3 py-2.5"
            style={{ borderColor: inc ? color + "55" : "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[var(--text)]">{l.line}</span>
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            </div>
            <div className="mono mt-1 text-[11px] text-[var(--faint)]">{l.equipment_id}</div>
            <div className="mt-1.5 text-[11px]" style={{ color: inc ? color : "var(--muted)" }}>{word}</div>
          </div>
        );
      })}
    </div>
  );
}
