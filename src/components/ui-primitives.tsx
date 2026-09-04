import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}) {
  const toneClass =
    deltaTone === "positive"
      ? "text-emerald-400"
      : deltaTone === "negative"
        ? "text-rose-400"
        : "text-slate-400";
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold text-white tabular-nums">{value}</p>
      {delta && <p className={cn("mt-1 text-xs", toneClass)}>{delta}</p>}
    </Card>
  );
}

export function ProgressBar({ value, tone = "sky" }: { value: number; tone?: "sky" | "emerald" | "rose" | "orange" }) {
  const toneClass = {
    sky: "bg-sky-400",
    emerald: "bg-emerald-400",
    rose: "bg-rose-400",
    orange: "bg-orange-400",
  }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={cn("h-full rounded-full transition-all duration-500", toneClass)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "default",
  size = "md",
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "success" | "danger" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}) {
  const variantClass = {
    default: "bg-white/10 text-white hover:bg-white/20",
    success: "bg-emerald-500/90 text-white hover:bg-emerald-500",
    danger: "bg-rose-500/90 text-white hover:bg-rose-500",
    ghost: "bg-transparent text-slate-300 hover:bg-white/10",
  }[variant];
  const sizeClass = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variantClass,
        sizeClass,
        className
      )}
    >
      {children}
    </button>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-slate-500">
      {label}
    </div>
  );
}
