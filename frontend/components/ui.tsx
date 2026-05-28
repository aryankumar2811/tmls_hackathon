"use client";

import type { ReactNode } from "react";
import { cn, SEVERITY } from "@/lib/ui";
import type { Severity } from "@/lib/types";

export function Panel({
  title,
  right,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn("rounded-md border bg-[var(--surface)]", className)}
      style={{ borderColor: "var(--border)" }}
    >
      {title && (
        <header
          className="flex h-9 items-center justify-between border-b px-3.5"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            {title}
          </h2>
          {right}
        </header>
      )}
      <div className={cn("p-3.5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function SeverityBadge({ severity, small }: { severity: Severity; small?: boolean }) {
  const s = SEVERITY[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border font-medium",
        small ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-[11px]",
      )}
      style={{ color: s.color, borderColor: s.color + "55", background: s.color + "14" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export function StatusBadge({ tone, children }: { tone: "investigating" | "diagnosed" | "neutral"; children: ReactNode }) {
  const map = {
    investigating: "var(--high)",
    diagnosed: "var(--ok)",
    neutral: "var(--muted)",
  };
  const c = map[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium"
      style={{ color: c, borderColor: c + "55", background: c + "12" }}
    >
      {tone === "investigating" && (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      )}
      {children}
    </span>
  );
}

export function Metric({ label, value, sub, color }: { label: string; value: ReactNode; sub?: string; color?: string }) {
  return (
    <div className="rounded-md border bg-[var(--surface-2)] px-3 py-2.5" style={{ borderColor: "var(--border)" }}>
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <div className="mono mt-1 text-[19px] font-medium leading-none" style={{ color: color ?? "var(--text)" }}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-[var(--faint)]">{sub}</div>}
    </div>
  );
}
