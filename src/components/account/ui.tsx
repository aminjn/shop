"use client";

import type { ReactNode } from "react";

/** Rounded surface card matching the cart-page convention. */
export function Card({
  children,
  className = "",
  pad = 20,
}: {
  children: ReactNode;
  className?: string;
  pad?: number;
}) {
  return (
    <div
      className={`rounded-[16px] ${className}`}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        padding: pad,
      }}
    >
      {children}
    </div>
  );
}

/** Section heading used at the top of each panel. */
export function SectionHead({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-extrabold tracking-tight">{title}</h1>
        {sub && (
          <p className="mt-1 text-[13.5px]" style={{ color: "var(--muted)" }}>
            {sub}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  processing: { bg: "rgba(245,158,11,.16)", fg: "#b45309" },
  shipped: { bg: "rgba(42,111,219,.16)", fg: "#2a6fdb" },
  delivered: { bg: "rgba(31,138,91,.16)", fg: "#1f8a5b" },
  cancelled: { bg: "rgba(225,29,72,.16)", fg: "#e11d48" },
  paid: { bg: "rgba(31,138,91,.16)", fg: "#1f8a5b" },
  unpaid: { bg: "rgba(225,29,72,.16)", fg: "#e11d48" },
  open: { bg: "rgba(42,111,219,.16)", fg: "#2a6fdb" },
  answered: { bg: "rgba(31,138,91,.16)", fg: "#1f8a5b" },
  closed: { bg: "rgba(120,120,120,.18)", fg: "var(--muted)" },
};

/** Coloured status pill; falls back to a neutral tone for unknown keys. */
export function StatusBadge({ tone, label }: { tone: string; label: string }) {
  const c = STATUS_TONE[tone] ?? { bg: "var(--surface2)", fg: "var(--muted)" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-extrabold"
      style={{ background: c.bg, color: c.fg }}
    >
      {label}
    </span>
  );
}

/** Small ghost button used for row-level actions (track, edit, download...). */
export function GhostButton({
  children,
  onClick,
  accent,
}: {
  children: ReactNode;
  onClick?: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] px-3 py-2 text-[12.5px] font-bold transition"
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        color: accent ? "var(--accent)" : "var(--text)",
      }}
    >
      {children}
    </button>
  );
}
