"use client";

import Chart from "./Chart";
import SensorChart from "./SensorChart";
import { Stat } from "./ui";
import type { Channel, MLMeta, SensorFrame } from "@/lib/types";

export default function PredictivePanel({
  ml,
  channels,
  frames,
  playhead,
  fireAt,
}: {
  ml: MLMeta;
  channels: Channel[];
  frames: SensorFrame[];
  playhead: number;
  fireAt?: number;
}) {
  const curve = ml.failure_probability ?? [];
  const current =
    [...curve].reverse().find((p) => p.t <= playhead)?.p ?? curve[curve.length - 1]?.p ?? 0;
  const pct = Math.round(current * 100);

  const gauge = {
    series: [
      {
        type: "gauge",
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        radius: "92%",
        progress: { show: true, width: 12, itemStyle: { color: pct > 70 ? "#f87171" : pct > 40 ? "#fb923c" : "#34d399" } },
        axisLine: { lineStyle: { width: 12, color: [[1, "#232a36"]] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, 0],
          fontSize: 30,
          fontWeight: 700,
          color: "#e7ecf3",
          formatter: "{value}%",
        },
        data: [{ value: pct }],
        title: { show: false },
      },
    ],
  };

  const feats = Object.entries(ml.feature_contributions ?? {}).sort((a, b) => a[1] - b[1]);
  const featBars = {
    grid: { left: 130, right: 36, top: 6, bottom: 14 },
    xAxis: { type: "value", min: 0, max: 1, axisLabel: { show: false }, splitLine: { lineStyle: { color: "#1b212b" } } },
    yAxis: {
      type: "category",
      data: feats.map((f) => f[0]),
      axisLabel: { color: "#c7cedb", fontSize: 11 },
      axisLine: { lineStyle: { color: "#2a3240" } },
    },
    series: [
      {
        type: "bar",
        barWidth: 11,
        data: feats.map((f) => ({ value: +f[1].toFixed(2), itemStyle: { borderRadius: 3, color: "#38bdf8" } })),
        label: { show: true, position: "right", color: "#e7ecf3", fontSize: 10, formatter: (p: { value: number }) => `${Math.round(p.value * 100)}%` },
      },
    ],
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-[var(--panel-2)] p-2" style={{ borderColor: "var(--border)" }}>
          <div className="px-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">Failure probability</div>
          <Chart option={gauge} height={150} />
        </div>
        <div className="flex flex-col gap-2">
          <Stat label="Remaining useful life" value={`${ml.rul_hours[0]}–${ml.rul_hours[1]} h`} accent />
          <div className="rounded-lg border bg-[var(--panel-2)] p-2" style={{ borderColor: "var(--border)" }}>
            <div className="mb-1 px-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Feature contribution
            </div>
            <Chart option={featBars} height={108} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-[var(--panel-2)] p-2" style={{ borderColor: "var(--border)" }}>
        <div className="mb-1 px-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
          Sensor channels (model input)
        </div>
        <SensorChart channels={channels} frames={frames} fireAt={fireAt} height={220} />
      </div>
    </div>
  );
}
