"use client";

import { useState } from "react";
import { Play } from "lucide-react";

const MIN_VISIBLE_MS = 700;

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
        const t0 = Date.now();
        try {
          await onRun();
        } finally {
          const elapsed = Date.now() - t0;
          if (elapsed < MIN_VISIBLE_MS) {
            await new Promise((r) => setTimeout(r, MIN_VISIBLE_MS - elapsed));
          }
          setBusy(false);
        }
      }}
      className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13px] font-medium text-[var(--text)] transition-colors hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      {busy || running ? (
        <>
          <span
            className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
          Running model…
        </>
      ) : (
        <>
          <Play className="h-3.5 w-3.5 text-[var(--muted)]" />
          Run simulation
        </>
      )}
    </button>
  );
}
