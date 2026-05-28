"use client";

import { Camera } from "lucide-react";

export default function VisionPlaceholder({
  defectCount,
  defectRatePct,
}: {
  defectCount?: number | null;
  defectRatePct?: number | null;
}) {
  return (
    <div
      className="rounded-md border bg-[var(--surface-2)] p-4"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-start gap-3">
        <span
          className="grid h-8 w-8 place-items-center rounded-md border"
          style={{ borderColor: "var(--border)" }}
        >
          <Camera className="h-4 w-4 text-[var(--muted)]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-[var(--text)]">
            Vision model — awaiting training
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">
            The YOLOv11 line-camera model is being trained by the CV team. Until it
            ships, the quality signal is sourced from the defect-count sensor on the
            same record.
          </p>
        </div>
      </div>
      {(defectCount != null || defectRatePct != null) && (
        <dl className="mono mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-[12px]"
          style={{ borderColor: "var(--border)" }}>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Defect count</dt>
            <dd className="text-[var(--text)]">{defectCount ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Defect rate</dt>
            <dd className="text-[var(--text)]">
              {defectRatePct != null ? `${defectRatePct}%` : "—"}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
