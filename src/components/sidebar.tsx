"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlayCircle,
  ShieldCheck,
  DollarSign,
  KeyRound,
  AlertTriangle,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useControlCenter } from "@/lib/store-context";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/runs", label: "Agent Runs", icon: PlayCircle },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/costs", label: "Cost & Usage", icon: DollarSign },
  { href: "/permissions", label: "Permissions", icon: KeyRound },
  { href: "/errors", label: "Errors & Retries", icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { connected, approvals, runs } = useControlCenter();
  const pendingApprovals = approvals.filter((a) => a.decision === "pending").length;
  const activeRuns = runs.filter((r) =>
    ["running", "retrying", "queued", "awaiting_approval"].includes(r.status)
  ).length;

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-[#0b0e14]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500">
          <Bot className="h-4.5 w-4.5 text-white" size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Control Center</p>
          <p className="text-[11px] text-slate-500 leading-tight">AI Automation Ops</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          const badge =
            item.href === "/approvals" && pendingApprovals > 0
              ? pendingApprovals
              : item.href === "/runs" && activeRuns > 0
                ? activeRuns
                : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon size={16} />
                {item.label}
              </span>
              {badge !== null && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold",
                    item.href === "/approvals"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-sky-500/20 text-sky-300"
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              connected ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
            )}
          />
          {connected ? "Live feed connected" : "Connecting…"}
        </div>
      </div>
    </aside>
  );
}
