"use client";

import dynamic from "next/dynamic";

// echarts-for-react is client-only; load it without SSR.
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export default function Chart({
  option,
  height = 220,
}: {
  option: Record<string, unknown>;
  height?: number;
}) {
  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      opts={{ renderer: "canvas" }}
      notMerge
      lazyUpdate
    />
  );
}
