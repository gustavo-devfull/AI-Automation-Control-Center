import { cn } from "@/lib/utils";

type SiteStatus = "up" | "down" | "unknown";

const STATUS_STYLES: Record<SiteStatus, string> = {
  up: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  down: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  unknown: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const STATUS_LABELS: Record<SiteStatus, string> = {
  up: "Online",
  down: "Fora do ar",
  unknown: "Verificando…",
};

const STATUS_DOT: Record<SiteStatus, string> = {
  up: "bg-emerald-400",
  down: "bg-rose-400 animate-pulse",
  unknown: "bg-slate-400 animate-pulse",
};

export function StatusBadge({ status, large }: { status: SiteStatus; large?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-medium whitespace-nowrap",
        STATUS_STYLES[status],
        large ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs"
      )}
    >
      <span
        className={cn("rounded-full", STATUS_DOT[status], large ? "h-2.5 w-2.5" : "h-1.5 w-1.5")}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function CheckRowBadge({ success }: { success: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        success
          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
          : "bg-rose-500/15 text-rose-300 border-rose-500/30"
      )}
    >
      {success ? "OK" : "Falha"}
    </span>
  );
}
