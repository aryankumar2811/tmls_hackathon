"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ScenarioMeta } from "@/lib/types";
import { SEVERITY } from "@/lib/ui";

/** Demo affordance: inject a simulated fault event. Deliberately secondary. */
export default function SimulateMenu({
  scenarios,
  onSelect,
}: {
  scenarios: ScenarioMeta[];
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13px] text-[var(--text)] transition-colors hover:border-[var(--border-strong)]"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        Simulate event
        <ChevronDown className="h-3.5 w-3.5 text-[var(--muted)]" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-30 mt-1.5 w-72 overflow-hidden rounded-md border shadow-xl"
          style={{ borderColor: "var(--border-strong)", background: "var(--surface)" }}
        >
          <div className="border-b px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--faint)]"
            style={{ borderColor: "var(--border)" }}>
            Inject test fault
          </div>
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => { onSelect(s.id); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--surface-2)]"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SEVERITY[s.severity].color }} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] text-[var(--text)]">{s.title}</span>
                <span className="block text-[11px] text-[var(--faint)]">{s.line} · {s.equipment_id}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
