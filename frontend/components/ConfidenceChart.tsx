"use client";

import Chart from "./Chart";
import type { Detection } from "@/lib/types";

/** Horizontal bars of max confidence per detected class (vision model output). */
export default function ConfidenceChart({
  detections,
  threshold = 0.5,
  height = 150,
}: {
  detections: Detection[];
  threshold?: number;
  height?: number;
}) {
  const byClass = new Map<string, number>();
  for (const d of detections) {
    byClass.set(d.label, Math.max(byClass.get(d.label) ?? 0, d.confidence));
  }
  const rows = [...byClass.entries()].sort((a, b) => a[1] - b[1]);

  const option = {
    grid: { left: 96, right: 36, top: 8, bottom: 16 },
    xAxis: {
      type: "value",
      min: 0,
      max: 1,
      axisLabel: { color: "#8a93a3", fontSize: 10, formatter: (v: number) => `${v * 100}%` },
      splitLine: { lineStyle: { color: "#1b212b" } },
    },
    yAxis: {
      type: "category",
      data: rows.map((r) => r[0]),
      axisLabel: { color: "#c7cedb", fontSize: 11 },
      axisLine: { lineStyle: { color: "#2a3240" } },
    },
    series: [
      {
        type: "bar",
        barWidth: 12,
        data: rows.map((r) => ({
          value: +r[1].toFixed(3),
          itemStyle: {
            borderRadius: 3,
            color: r[0] === "good" ? "#34d399" : "#f87171",
          },
        })),
        label: {
          show: true,
          position: "right",
          color: "#e7ecf3",
          fontSize: 10,
          formatter: (p: { value: number }) => `${(p.value * 100).toFixed(0)}%`,
        },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "#8a93a3", type: "dashed", width: 1 },
          label: { show: false },
          data: [{ xAxis: threshold }],
        },
      },
    ],
  };

  return <Chart option={option} height={height} />;
}
