"use client";

import type { ReactNode } from "react";
import { cn, SEVERITY } from "@/lib/ui";
import type { Severity } from "@/lib/types";

export function Panel({
  title,
  right,
  children,
  className,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-[var(--panel)]/80 backdrop-blur-sm",
        className,
      )}
      style={{ borderColor: "var(--border)" }}
    >
      {title && (
        <header className="flex items-center justify-between border-b px-4 py-2.5"
          style={{ borderColor: "var(--border)" }}>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {title}
          </h2>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY[severity];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium", s.bg, s.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function Stat({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border bg-[var(--panel-2)] px-3 py-2.5" style={{ borderColor: "var(--border)" }}>
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <div className={cn("mono mt-0.5 text-lg font-semibold", accent ? "text-[var(--accent)]" : "text-[var(--text)]")}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-[var(--muted)]">{sub}</div>}
    </div>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]", className)}
      style={{ borderColor: "var(--border)" }}>
      {children}
    </span>
  );
}
