"use client";

import type { ModelInfo } from "@/lib/types";

interface Row {
  name: string;
  value: number | null;
  baseline: number | null;
  unit: string;
  importance: number;
  anomalous: boolean;
}

function buildRows(features: Record<string, number | string | null>, model: ModelInfo): Row[] {
  const importance = model.feature_importances;
  return model.numeric_features
    .map((n) => {
      const v = features[n];
      const val = typeof v === "number" ? v : null;
      const b = model.baselines[n] ?? null;
      const t = model.anomaly_thresholds[n];
      return {
        name: n,
        value: val,
        baseline: b,
        unit: model.units[n] ?? "",
        importance: importance[n] ?? 0,
        anomalous: t != null && val != null && val >= t,
      };
    })
    .sort((a, b) => b.importance - a.importance);
}

function pretty(n: string): string {
  return n
    .replace(/_/g, " ")
    .replace(/Pct/g, "%")
    .replace(/mm s/g, "mm/s")
    .replace(/m min/g, "m/min")
    .replace(/PSI/g, "PSI");
}

export default function FeatureValuesTable({
  features,
  model,
}: {
  features: Record<string, number | string | null>;
  model: ModelInfo;
}) {
  const rows = buildRows(features, model);
  const maxImp = Math.max(...rows.map((r) => r.importance), 0.001);

  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="text-left text-[var(--faint)]">
          <th className="py-1.5 font-normal">Feature</th>
          <th className="py-1.5 text-right font-normal">Value</th>
          <th className="py-1.5 text-right font-normal">Baseline</th>
          <th className="py-1.5 pl-3 font-normal">Importance</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="border-t" style={{ borderColor: "var(--border)" }}>
            <td className="py-1.5 text-[var(--text)]">{pretty(r.name)}</td>
            <td
              className="mono py-1.5 text-right"
              style={{ color: r.anomalous ? "var(--critical)" : "var(--text)" }}
            >
              {r.value != null ? `${r.value}${r.unit ? " " + r.unit : ""}` : "—"}
            </td>
            <td className="mono py-1.5 text-right text-[var(--muted)]">
              {r.baseline != null ? `${r.baseline}${r.unit ? " " + r.unit : ""}` : "—"}
            </td>
            <td className="py-1.5 pl-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-full rounded-full" style={{ background: "var(--surface-2)" }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${(r.importance / maxImp) * 100}%`,
                      background: r.anomalous ? "var(--critical)" : "var(--muted)",
                    }}
                  />
                </div>
                <span className="mono w-10 shrink-0 text-right text-[11px] text-[var(--muted)]">
                  {(r.importance * 100).toFixed(1)}%
                </span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
