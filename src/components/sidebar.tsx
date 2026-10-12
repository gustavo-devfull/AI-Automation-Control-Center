"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTree, Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMonitor } from "@/lib/store-context";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/history", label: "Histórico", icon: ListTree },
];

export function Sidebar() {
  const pathname = usePathname();
  const { connected, currentStatus } = useMonitor();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-[#0b0e14]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500">
          <Radar className="h-4.5 w-4.5 text-white" size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Uptime Monitor</p>
          <p className="text-[11px] text-slate-500 leading-tight">site.gustavosantos.xyz</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              currentStatus === "up"
                ? "bg-emerald-400"
                : currentStatus === "down"
                  ? "bg-rose-400 animate-pulse"
                  : "bg-slate-600"
            )}
          />
          Site {currentStatus === "up" ? "online" : currentStatus === "down" ? "fora do ar" : "desconhecido"}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span
            className={cn("h-2 w-2 rounded-full", connected ? "bg-sky-400 animate-pulse" : "bg-slate-700")}
          />
          {connected ? "Feed ao vivo conectado" : "Conectando…"}
        </div>
      </div>
    </aside>
  );
}
