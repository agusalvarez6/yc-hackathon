import { cn } from "@/lib/utils";
import type { Risk, Status } from "@/lib/types";

const statusStyles: Record<Status, string> = {
  ready:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  partial:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  missing:
    "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
};

const statusLabel: Record<Status, string> = {
  ready: "Ready",
  partial: "Partial",
  missing: "Missing",
};

const riskStyles: Record<Risk, string> = {
  low: "bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  medium:
    "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  high: "bg-rose-100 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        statusStyles[status],
      )}
    >
      <span
        className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full",
          status === "ready" && "bg-emerald-500",
          status === "partial" && "bg-amber-500",
          status === "missing" && "bg-rose-500",
        )}
      />
      {statusLabel[status]}
    </span>
  );
}

export function RiskPill({ risk }: { risk: Risk }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset capitalize",
        riskStyles[risk],
      )}
    >
      {risk}
    </span>
  );
}
