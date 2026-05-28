// REST helpers for the OvenMind backend.

import type { Issue, ModelInfo } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export async function runSimulation(): Promise<Issue[]> {
  const r = await fetch(`${API_BASE}/simulate`, { method: "POST" });
  if (!r.ok) throw new Error(`POST /simulate ${r.status}`);
  return (await r.json()).issues;
}

export async function getIssues(): Promise<Issue[]> {
  const r = await fetch(`${API_BASE}/issues`, { cache: "no-store" });
  if (!r.ok) throw new Error(`GET /issues ${r.status}`);
  return (await r.json()).issues;
}

export async function analyzeIssue(id: string): Promise<{ session: string }> {
  const r = await fetch(`${API_BASE}/issues/${encodeURIComponent(id)}/analyze`, {
    method: "POST",
  });
  if (!r.ok) throw new Error(`POST /issues/${id}/analyze ${r.status}`);
  return r.json();
}

export async function getModelInfo(): Promise<ModelInfo> {
  const r = await fetch(`${API_BASE}/model/info`, { cache: "no-store" });
  if (!r.ok) throw new Error(`GET /model/info ${r.status}`);
  return r.json();
}
