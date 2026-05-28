"use client";

import { useState } from "react";
import { Play } from "lucide-react";

export default function RunSimulationButton({
  onRun,
  running,
}: {
  onRun: () => Promise<void> | void;
  running?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy || running}
      onClick={async () => {
        setBusy(true);
        try {
          await onRun();
        } finally {
          setBusy(false);
        }
      }}
      className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13px] font-medium text-[var(--text)] transition-colors hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-50"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <Play className="h-3.5 w-3.5 text-[var(--muted)]" />
      {busy || running ? "Running…" : "Run simulation"}
    </button>
  );
}
