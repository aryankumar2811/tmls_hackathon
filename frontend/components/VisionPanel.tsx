"use client";

import type { Detection } from "@/lib/types";

/**
 * Vision-model view. Each detection is rendered as a labelled box with its
 * product drawn inside the same box, so the box always frames the product.
 * No background image, no animation.
 */
export default function VisionPanel({
  detections,
  defectRate,
  caption,
}: {
  detections: Detection[];
  defectRate?: number;
  caption?: string;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-md border"
      style={{
        aspectRatio: "16 / 7",
        borderColor: "var(--border)",
        background:
          "repeating-linear-gradient(90deg,#101317 0 38px,#0d1014 38px 40px), #0d1014",
      }}
    >
      {/* belt edge guides */}
      <span className="absolute inset-x-0 top-[26%] h-px" style={{ background: "#20252c" }} />
      <span className="absolute inset-x-0 bottom-[8%] h-px" style={{ background: "#20252c" }} />

      {detections.map((d, i) => {
        const good = d.label === "good";
        const color = good ? "var(--ok)" : "var(--critical)";
        const [x, y, w, h] = d.bbox;
        return (
          <div
            key={i}
            className="absolute"
            style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }}
          >
            <div className="relative h-full w-full rounded-[3px]" style={{ border: `1.5px solid ${color}` }}>
              {/* product */}
              <div
                className="absolute"
                style={{
                  inset: "12%",
                  borderRadius: "46%",
                  background: good
                    ? "radial-gradient(60% 55% at 45% 38%, #e7c07c, #b9852f 75%, #946724)"
                    : "radial-gradient(60% 55% at 45% 38%, #d2a35f, #8a5a26 70%, #5d3c18)",
                }}
              >
                {!good && (
                  <span
                    className="absolute rounded-full"
                    style={{ inset: "20% 30% 45% 18%", background: "rgba(60,32,12,0.55)", filter: "blur(2px)" }}
                  />
                )}
              </div>
              {/* label */}
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
        <span className="mono rounded-[3px] border px-1.5 py-0.5 text-[10px] text-[var(--muted)]"
          style={{ borderColor: "var(--border)", background: "rgba(11,13,16,0.7)" }}>
          {caption ?? "LINE CAMERA"}
        </span>
      </div>
      <div className="absolute right-2.5 top-2.5 mono rounded-[3px] border px-1.5 py-0.5 text-[10px]"
        style={{ borderColor: "var(--border)", background: "rgba(11,13,16,0.7)" }}>
        <span className="text-[var(--muted)]">YOLOv11 · </span>
        <span className="text-[var(--text)]">{detections.length} det</span>
        {defectRate != null && <span className="ml-2" style={{ color: "var(--critical)" }}>{defectRate.toFixed(1)}%</span>}
      </div>
    </div>
  );
}
