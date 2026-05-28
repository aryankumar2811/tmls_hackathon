"use client";

import Chart from "./Chart";
import type { Channel, SensorFrame } from "@/lib/types";

const PALETTE = ["#38bdf8", "#fb923c", "#34d399", "#a78bfa", "#f472b6", "#facc15"];

/**
 * Multi-channel sensor trace, each channel normalized to % change from its own
 * baseline so heterogeneous units share one axis and the drift is obvious.
 */
export default function SensorChart({
  channels,
  frames,
  fireAt,
  height = 240,
}: {
  channels: Channel[];
  frames: SensorFrame[];
  fireAt?: number;
  height?: number;
}) {
  const series = channels.map((ch, i) => ({
    name: ch.label,
    type: "line",
    showSymbol: false,
    smooth: true,
    lineStyle: { width: 2 },
    color: PALETTE[i % PALETTE.length],
    data: frames.map((f) => [
      f.t,
      ch.baseline ? +(((f.values[ch.key] - ch.baseline) / ch.baseline) * 100).toFixed(2) : 0,
    ]),
  }));

  const option = {
    grid: { left: 44, right: 12, top: 28, bottom: 28 },
    legend: {
      top: 0,
      textStyle: { color: "#8a93a3", fontSize: 10 },
      itemWidth: 10,
      itemHeight: 6,
    },
    tooltip: { trigger: "axis", backgroundColor: "#12151c", borderColor: "#232a36",
      textStyle: { color: "#e7ecf3", fontSize: 11 } },
    xAxis: {
      type: "value",
      name: "s",
      min: 0,
      axisLine: { lineStyle: { color: "#2a3240" } },
      axisLabel: { color: "#8a93a3", fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      name: "% Δ baseline",
      nameTextStyle: { color: "#8a93a3", fontSize: 10 },
      axisLabel: { color: "#8a93a3", fontSize: 10 },
      splitLine: { lineStyle: { color: "#1b212b" } },
    },
    series:
      fireAt != null
        ? [
            ...series,
            {
              name: "alert",
              type: "line",
              data: [],
              markLine: {
                silent: true,
                symbol: "none",
                lineStyle: { color: "#ff7a18", type: "dashed", width: 1.5 },
                label: { color: "#ff7a18", fontSize: 10, formatter: "anomaly" },
                data: [{ xAxis: fireAt }],
              },
            },
          ]
        : series,
  };

  return <Chart option={option} height={height} />;
}
