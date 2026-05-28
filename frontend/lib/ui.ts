// Small presentation helpers shared across components.

import type { Severity } from "./types";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export const SEVERITY: Record<Severity, { label: string; text: string; bg: string; dot: string }> = {
  critical: { label: "Critical", text: "text-red-300", bg: "bg-red-500/15 border-red-500/40", dot: "bg-red-500" },
  high: { label: "High", text: "text-orange-300", bg: "bg-orange-500/15 border-orange-500/40", dot: "bg-orange-500" },
  medium: { label: "Medium", text: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/40", dot: "bg-amber-400" },
  low: { label: "Low", text: "text-sky-300", bg: "bg-sky-500/15 border-sky-500/40", dot: "bg-sky-400" },
};

export function usd(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

export const AGENT_COLORS: Record<string, string> = {
  Supervisor: "#a78bfa",
  "Equipment Agent": "#38bdf8",
  "Quality Agent": "#34d399",
  "Correlation Agent": "#fb923c",
  "Work-Order Agent": "#f472b6",
  "Reporting Agent": "#facc15",
};
