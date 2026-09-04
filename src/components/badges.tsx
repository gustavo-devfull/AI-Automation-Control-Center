import { cn } from "@/lib/utils";
import type { LogLevel, RunStatus } from "@/lib/types";

const STATUS_STYLES: Record<RunStatus, string> = {
  queued: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  running: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  awaiting_approval: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  retrying: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  succeeded: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  failed: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  denied: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const STATUS_LABELS: Record<RunStatus, string> = {
  queued: "Queued",
  running: "Running",
  awaiting_approval: "Awaiting approval",
  retrying: "Retrying",
  succeeded: "Succeeded",
  failed: "Failed",
  denied: "Denied",
};

const STATUS_DOT: Record<RunStatus, string> = {
  queued: "bg-slate-400",
  running: "bg-sky-400 animate-pulse",
  awaiting_approval: "bg-amber-400 animate-pulse",
  retrying: "bg-orange-400 animate-pulse",
  succeeded: "bg-emerald-400",
  failed: "bg-rose-400",
  denied: "bg-rose-400",
};

export function StatusBadge({ status }: { status: RunStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status]
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}

const RISK_STYLES: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  high: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export function RiskBadge({ risk }: { risk: "low" | "medium" | "high" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        RISK_STYLES[risk]
      )}
    >
      {risk} risk
    </span>
  );
}

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: "text-slate-500",
  info: "text-sky-400",
  warn: "text-amber-400",
  error: "text-rose-400",
};

export function LogLevelTag({ level }: { level: LogLevel }) {
  return (
    <span className={cn("font-mono text-[11px] font-semibold uppercase", LEVEL_STYLES[level])}>
      {level}
    </span>
  );
}

const SCOPE_STYLES: Record<string, string> = {
  read: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  write: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  execute: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  network: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  financial: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        SCOPE_STYLES[scope] ?? SCOPE_STYLES.read
      )}
    >
      {scope}
    </span>
  );
}
