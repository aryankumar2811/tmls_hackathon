"use client";

import { Camera } from "lucide-react";
import type { IssueState } from "@/lib/types";

const SLOTS = 6;

/** Defect class shortlist per machine type — what production YOLO would emit. */
const CLASS_BY_TYPE: Record<string, string[]> = {
  Decorating: ["incomplete_topping", "off_center", "smeared"],
  Sanitation: ["residue_detected", "improper_clean", "scale_buildup"],
  Packaging: ["misaligned_label", "wrinkled_film", "missing_label"],
  "Sheeting/Laminating": ["uneven_lamination", "thin_spot", "torn_sheet"],
  Conveying: ["product_offset", "mis_oriented", "stuck"],
  Freezing: ["frost_buildup", "under_frozen", "ice_crystals"],
  Baking: ["uneven_browning", "burnt_edge", "under_baked"],
  Mixing: ["dense_crumb", "under_mixed", "lumpy"],
  Frying: ["soggy", "over_fried", "uneven_color"],
  Cooling: ["mis_aligned", "stuck"],
  Forming: ["off_spec", "deformed", "split"],
  Proofing: ["under_proofed", "over_proofed", "collapsed"],
  "Quality Control": ["false_reject", "low_signal"],
  "Water Treatment": ["foaming", "discolored"],
  "Ingredient Handling": ["clogged", "off_weight"],
  "Dividing/Portioning": ["off_weight", "uneven_cut"],
  Depositing: ["off_weight", "drip", "missed_pocket"],
  Slicing: ["uneven_slice", "missed_cut"],
};

interface Det {
  slot: number;
  good: boolean;
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
}

/** Deterministic per-issue seed so each card always renders the same scene. */
function seeded(s: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

function defectiveCount(rate: number, severity: IssueState["severity"]): number {
  // discrete tiers so a 7% rate doesn't visually look the same as 1%
  if (severity === "critical") return rate >= 5 ? 4 : 3;
  if (severity === "medium") return rate >= 3 ? 3 : 2;
  return rate >= 0.5 ? 1 : 0;
}

function buildScene(issue: IssueState): Det[] {
  const rate = Number(issue.features.Defect_Rate_Pct) || 0;
  const rnd = seeded(issue.id);
  const classes = CLASS_BY_TYPE[issue.machine_type] ?? ["off_spec", "defect"];
  const numDefective = defectiveCount(rate, issue.severity);

  // place the defective slots randomly across the row
  const order = [...Array(SLOTS).keys()].sort(() => rnd() - 0.5);
  const defSlots = new Set(order.slice(0, numDefective));

  return Array.from({ length: SLOTS }, (_, i) => {
    const good = !defSlots.has(i);
    const x = +(0.045 + i * 0.155).toFixed(3);
    const bbox: [number, number, number, number] = [x, 0.4, 0.115, 0.36];
    if (good) {
      return {
        slot: i,
        good: true,
        label: "good",
        confidence: +(0.9 + rnd() * 0.07).toFixed(3),
        bbox,
      };
    }
    const lbl = classes[Math.floor(rnd() * classes.length)];
    const confBase = issue.severity === "critical" ? 0.88 : issue.severity === "medium" ? 0.82 : 0.74;
    return {
      slot: i,
      good: false,
      label: lbl,
      confidence: +(confBase + rnd() * 0.1).toFixed(3),
      bbox,
    };
  });
}

export default function VisionSimulation({ issue }: { issue: IssueState }) {
  const scene = buildScene(issue);
  const camId = `L${issue.line.split("-").pop() ?? "?"}-CAM`;
  const numDef = scene.filter((d) => !d.good).length;
  const realRate = Number(issue.features.Defect_Rate_Pct) || 0;
  const realCount = Number(issue.features.Defect_Count) || 0;
  const byClass = scene.reduce<Record<string, number>>((acc, d) => {
    acc[d.label] = (acc[d.label] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {/* "simulated production output" banner */}
      <div
        className="flex items-center gap-2 rounded-md border px-3 py-2 text-[11px]"
        style={{
          borderColor: "var(--medium)55",
          background: "var(--medium)10",
          color: "var(--medium)",
        }}
      >
        <Camera className="h-3 w-3 shrink-0" />
        <span>
          <strong className="font-semibold">Production preview.</strong>{" "}
          The vision model is still in training; this card simulates the
          detections a deployed YOLOv11 would emit, driven by the model&apos;s
          predicted defect rate ({realRate.toFixed(2)}%).
        </span>
      </div>

      {/* camera frame */}
      <div
        className="relative w-full overflow-hidden rounded-md border"
        style={{
          aspectRatio: "16 / 7",
          borderColor: "var(--border)",
          background:
            "repeating-linear-gradient(90deg,#101317 0 38px,#0d1014 38px 40px), #0d1014",
        }}
      >
        {/* belt rails */}
        <span className="absolute inset-x-0 top-[26%] h-px" style={{ background: "#20252c" }} />
        <span className="absolute inset-x-0 bottom-[8%] h-px" style={{ background: "#20252c" }} />

        {scene.map((d) => {
          const color = d.good ? "var(--ok)" : "var(--critical)";
          const [x, y, w, h] = d.bbox;
          return (
            <div
              key={d.slot}
              className="absolute"
              style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }}
            >
              <div className="relative h-full w-full rounded-[3px]" style={{ border: `1.5px solid ${color}` }}>
                <div
                  className="absolute"
                  style={{
                    inset: "12%",
                    borderRadius: "46%",
                    background: d.good
                      ? "radial-gradient(60% 55% at 45% 38%, #e7c07c, #b9852f 75%, #946724)"
                      : "radial-gradient(60% 55% at 45% 38%, #d2a35f, #8a5a26 70%, #5d3c18)",
                  }}
                >
                  {!d.good && (
                    <span
                      className="absolute rounded-full"
                      style={{
                        inset: "20% 30% 45% 18%",
                        background: "rgba(60,32,12,0.55)",
                        filter: "blur(2px)",
                      }}
                    />
                  )}
                </div>
                <span
                  className="mono absolute -top-[15px] left-0 whitespace-nowrap rounded-[2px] px-1 text-[9px] font-medium leading-[14px]"
                  style={{ background: color, color: "#0b0d10" }}
                >
                  {d.label} {Math.round(d.confidence * 100)}
                </span>
              </div>
            </div>
          );
        })}

        <div className="absolute left-2.5 top-2.5 flex items-center gap-2">
          <span
            className="mono rounded-[3px] border px-1.5 py-0.5 text-[10px] text-[var(--muted)]"
            style={{ borderColor: "var(--border)", background: "rgba(11,13,16,0.7)" }}
          >
            {camId} · {issue.product ?? issue.machine_name}
          </span>
        </div>
        <div
          className="mono absolute right-2.5 top-2.5 rounded-[3px] border px-1.5 py-0.5 text-[10px]"
          style={{ borderColor: "var(--border)", background: "rgba(11,13,16,0.7)" }}
        >
          <span className="text-[var(--muted)]">YOLOv11 · </span>
          <span className="text-[var(--text)]">{SLOTS} det</span>
          {numDef > 0 && (
            <span className="ml-2" style={{ color: "var(--critical)" }}>
              {numDef} flagged
            </span>
          )}
        </div>
      </div>

      {/* stats + detections */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          className="rounded-md border bg-[var(--surface-2)] p-3"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Inference summary
          </div>
          <dl className="mono mt-2 space-y-1 text-[12px]">
            <Row k="Frame" v={`${camId}-${(scene[0]?.confidence ?? 0).toFixed(2)} · 30 fps`} />
            <Row k="Detections" v={`${SLOTS} (${SLOTS - numDef} good · ${numDef} defect)`} />
            <Row
              k="Predicted rate"
              v={`${((numDef / SLOTS) * 100).toFixed(1)}% per-frame`}
            />
            <Row k="Reported rate" v={`${realRate.toFixed(2)}% (defect sensor)`} />
            <Row k="Shift total" v={`${realCount.toLocaleString()} defective units`} />
          </dl>
        </div>

        <div
          className="rounded-md border bg-[var(--surface-2)] p-3"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Class distribution
          </div>
          <ul className="mt-2 space-y-1.5">
            {Object.entries(byClass)
              .sort((a, b) => b[1] - a[1])
              .map(([cls, count]) => {
                const isGood = cls === "good";
                const pct = (count / SLOTS) * 100;
                return (
                  <li key={cls} className="text-[12px]">
                    <div className="flex items-center justify-between">
                      <span
                        className="mono"
                        style={{ color: isGood ? "var(--ok)" : "var(--critical)" }}
                      >
                        {cls}
                      </span>
                      <span className="mono text-[var(--muted)]">
                        {count} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div
                      className="mt-1 h-1 rounded-full"
                      style={{ background: "var(--bg)" }}
                    >
                      <div
                        className="h-1 rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: isGood ? "var(--ok)" : "var(--critical)",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>

      {/* raw detections table */}
      <details className="rounded-md border bg-[var(--surface-2)]" style={{ borderColor: "var(--border)" }}>
        <summary className="cursor-pointer list-none px-3 py-2 text-[11px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--text)]">
          Raw detections (what the agent receives)
        </summary>
        <div className="border-t px-3 py-2" style={{ borderColor: "var(--border)" }}>
          <table className="mono w-full text-[11px]">
            <thead>
              <tr className="text-left text-[var(--faint)]">
                <th className="py-1 font-normal">#</th>
                <th className="py-1 font-normal">class</th>
                <th className="py-1 font-normal">conf</th>
                <th className="py-1 font-normal">bbox [x y w h]</th>
              </tr>
            </thead>
            <tbody>
              {scene.map((d) => (
                <tr
                  key={d.slot}
                  className="border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="py-1 text-[var(--faint)]">{d.slot}</td>
                  <td
                    className="py-1"
                    style={{ color: d.good ? "var(--ok)" : "var(--critical)" }}
                  >
                    {d.label}
                  </td>
                  <td className="py-1 text-[var(--text)]">
                    {(d.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-1 text-[var(--muted)]">
                    [{d.bbox.map((n) => n.toFixed(2)).join(" ")}]
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[var(--muted)]">{k}</dt>
      <dd className="text-[var(--text)]">{v}</dd>
    </div>
  );
}
