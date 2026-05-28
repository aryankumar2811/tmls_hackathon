"use client";

import { SEVERITY } from "@/lib/ui";

const LABELS = ["Low", "Medium", "Critical"] as const;
const COLORS = [SEVERITY.low.color, SEVERITY.medium.color, SEVERITY.critical.color];

export default function ClassProbabilityBar({
  probabilities,
  predicted,
}: {
  probabilities: [number, number, number];
  predicted: 1 | 2 | 3;
}) {
  const pct = probabilities.map((p) => Math.max(0, Math.min(1, p)));
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-[3px] border" style={{ borderColor: "var(--border)" }}>
        {pct.map((p, i) => (
          <div
            key={i}
            style={{
              width: `${(p * 100).toFixed(1)}%`,
              background: COLORS[i],
              opacity: predicted === i + 1 ? 1 : 0.35,
            }}
          />
        ))}
      </div>
      <div className="mono mt-2 grid grid-cols-3 gap-2 text-[11px]">
        {pct.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded border px-2 py-1"
            style={{
              borderColor: predicted === i + 1 ? COLORS[i] + "55" : "var(--border)",
              background: predicted === i + 1 ? COLORS[i] + "12" : "transparent",
            }}
          >
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLORS[i] }} />
              <span className="text-[var(--text)]">{LABELS[i]}</span>
            </span>
            <span style={{ color: predicted === i + 1 ? COLORS[i] : "var(--muted)" }}>
              {(p * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
