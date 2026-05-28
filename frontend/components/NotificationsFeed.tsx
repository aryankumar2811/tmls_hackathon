"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import type { Severity } from "@/lib/types";
import { cn, SEVERITY } from "@/lib/ui";

export interface Notification {
  session: string;
  scenario: string;
  title: string;
  equipment_id: string;
  line: string;
  severity: Severity;
  t: number;
  analyzing: boolean;
  done: boolean;
}

export default function NotificationsFeed({
  notifications,
  onOpen,
}: {
  notifications: Notification[];
  onOpen: (n: Notification) => void;
}) {
  if (notifications.length === 0) {
    return (
      <div className="flex h-full min-h-[120px] flex-col items-center justify-center text-center text-sm text-[var(--muted)]">
        <div className="mb-1 text-2xl">🟢</div>
        All lines nominal. Trigger a scenario to simulate a fault.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {notifications.map((n) => {
        const sev = SEVERITY[n.severity];
        return (
          <li key={n.session}>
            <button
              onClick={() => onOpen(n)}
              className="fadeup flex w-full items-center gap-3 rounded-lg border bg-[var(--panel-2)] px-3 py-2.5 text-left transition hover:border-[var(--accent)]/60"
              style={{ borderColor: "var(--border)" }}
            >
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", sev.bg)}>
                <AlertTriangle className={cn("h-4 w-4", sev.text)} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-[var(--text)]">{n.title}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                  <span>{n.line} · {n.equipment_id}</span>
                  <span className={cn("rounded px-1", sev.bg, sev.text)}>{sev.label}</span>
                  {n.analyzing && !n.done && (
                    <span className="text-[var(--accent)]">● analyzing…</span>
                  )}
                  {n.done && <span className="text-emerald-400">✓ report ready</span>}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
