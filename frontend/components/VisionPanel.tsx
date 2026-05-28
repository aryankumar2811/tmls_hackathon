"use client";

import Image from "next/image";
import type { Detection } from "@/lib/types";
import ConfidenceChart from "./ConfidenceChart";

/** Vision-model input/output: the product image with detection boxes overlaid. */
export default function VisionPanel({
  image,
  detections,
  defectRate,
  threshold = 0.5,
  showChart = true,
}: {
  image: string;
  detections: Detection[];
  defectRate?: number;
  threshold?: number;
  showChart?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border bg-black"
        style={{ borderColor: "var(--border)" }}>
        <Image src={image} alt="line camera frame" fill className="object-cover opacity-95" unoptimized />
        {detections.map((d, i) => {
          const good = d.label === "good";
          const [x, y, w, h] = d.bbox;
          return (
            <div
              key={i}
              className="absolute rounded-[3px]"
              style={{
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                width: `${w * 100}%`,
                height: `${h * 100}%`,
                border: `2px solid ${good ? "#34d399" : "#f87171"}`,
                boxShadow: good ? "none" : "0 0 0 1px rgba(248,113,113,0.3)",
              }}
            >
              <span
                className="mono absolute -top-[18px] left-0 whitespace-nowrap rounded px-1 text-[10px] font-medium"
                style={{ background: good ? "#34d399" : "#f87171", color: "#0a0c10" }}
              >
                {d.label} {Math.round(d.confidence * 100)}%
              </span>
            </div>
          );
        })}
        <div className="absolute right-2 top-2 rounded-md border bg-black/60 px-2 py-1 text-[10px]"
          style={{ borderColor: "var(--border)" }}>
          <span className="text-[var(--muted)]">YOLOv11 · </span>
          <span className="mono text-[var(--text)]">{detections.length} det</span>
          {defectRate != null && (
            <span className="mono ml-2 text-red-300">{defectRate.toFixed(1)}% defect</span>
          )}
        </div>
      </div>
      {showChart && detections.length > 0 && (
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Detection confidence (threshold {Math.round(threshold * 100)}%)
          </div>
          <ConfidenceChart detections={detections} threshold={threshold} />
        </div>
      )}
    </div>
  );
}
