// Presentation helpers shared across components.

import type { Severity } from "./types";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export const SEVERITY: Record<Severity, { label: string; color: string }> = {
  critical: { label: "Critical", color: "var(--critical)" },
  medium: { label: "Medium", color: "var(--medium)" },
  low: { label: "Low", color: "var(--low)" },
};

export function usd(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

export function relTime(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export const AGENT_COLORS: Record<string, string> = {
  Supervisor: "#9a86d4",
  "Equipment Agent": "#4f9dd1",
  "Quality Agent": "#3fa789",
  "Correlation Agent": "#d08a44",
  "Work-Order Agent": "#c673a0",
  "Reporting Agent": "#c4a64a",
};
