// REST helpers for the OvenMind backend.

import type { ReportResponse, ScenarioMeta, TriggerResponse } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export async function getScenarios(): Promise<ScenarioMeta[]> {
  const r = await fetch(`${API_BASE}/scenarios`, { cache: "no-store" });
  if (!r.ok) throw new Error(`GET /scenarios ${r.status}`);
  return (await r.json()).scenarios;
}

export async function triggerScenario(id: string): Promise<TriggerResponse> {
  const r = await fetch(`${API_BASE}/trigger?scenario=${encodeURIComponent(id)}`, {
    method: "POST",
  });
  if (!r.ok) throw new Error(`POST /trigger ${r.status}`);
  return r.json();
}

export async function getReport(session: string): Promise<ReportResponse> {
  const r = await fetch(`${API_BASE}/report/${session}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`GET /report ${r.status}`);
  return r.json();
}

export function imageUrl(path: string): string {
  // fixture image paths are absolute ("/images/..") served from /public
  return path.startsWith("http") ? path : path;
}
