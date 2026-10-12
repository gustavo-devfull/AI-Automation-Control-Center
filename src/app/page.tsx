"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Clock, ExternalLink, RefreshCw, TrendingUp } from "lucide-react";
import { useMonitor } from "@/lib/store-context";
import { formatClockTime, formatDuration, formatRelativeTime } from "@/lib/format";
import { Card, CardHeader, StatCard, Button, EmptyState } from "@/components/ui-primitives";
import { StatusBadge } from "@/components/badges";

function formatPercent(v: number | null): string {
  if (v === null) return "—";
  return `${v.toFixed(2)}%`;
}

function formatMs(v: number | null): string {
  if (v === null) return "—";
  return `${v}ms`;
}

export default function OverviewPage() {
  const { targetUrl, checks, incidents, currentStatus, lastCheckedAt, uptimePercent, avgLatencyMs, checkNow, checking, loading } =
    useMonitor();

  const latencyData = useMemo(
    () =>
      checks.slice(-60).map((c) => ({
        time: c.timestamp,
        latency: c.latencyMs ?? 0,
        success: c.success,
      })),
    [checks]
  );

  const openIncident = incidents.find((i) => !i.resolvedAt);
  const recentIncidents = incidents.slice(0, 5);
  const firstCheck = checks[0];

  if (loading) return <EmptyState label="Carregando dados de monitoramento…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Overview</h1>
          <a
            href={targetUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300"
          >
            {targetUrl} <ExternalLink size={12} />
          </a>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={currentStatus} large />
          <Button onClick={checkNow} disabled={checking} variant="default">
            <span className="flex items-center gap-1.5">
              <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
              Verificar agora
            </span>
          </Button>
        </div>
      </div>

      {openIncident && (
        <Card className="border-rose-500/30 bg-rose-500/10 p-4">
          <p className="text-sm font-medium text-rose-200">
            🔴 Site fora do ar desde {formatRelativeTime(openIncident.startedAt)}
          </p>
          <p className="mt-1 text-xs text-rose-300/80">
            Causa: {openIncident.cause} · {openIncident.checksFailed} checagem(ns) falharam
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Uptime 24h"
          value={formatPercent(uptimePercent["24h"])}
          icon={<Activity size={16} />}
        />
        <StatCard
          label="Uptime 7d"
          value={formatPercent(uptimePercent["7d"])}
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="Uptime 30d"
          value={formatPercent(uptimePercent["30d"])}
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="Latência média"
          value={formatMs(avgLatencyMs)}
          delta={lastCheckedAt ? `última checagem ${formatRelativeTime(lastCheckedAt)}` : undefined}
          icon={<Clock size={16} />}
        />
      </div>

      {firstCheck && (
        <p className="text-xs text-slate-500">
          Monitorando desde {formatRelativeTime(firstCheck.timestamp)} · {checks.length} checagens
          registradas na janela retida em memória. Percentuais de 7d/30d refletem o histórico
          disponível, não necessariamente o período completo.
        </p>
      )}

      <Card>
        <CardHeader title="Latência" subtitle="Últimas 60 checagens" />
        <div className="h-64 px-2 py-3">
          {latencyData.length === 0 ? (
            <EmptyState label="Nenhuma checagem registrada ainda" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="time"
                  tickFormatter={(v) => formatClockTime(v)}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis
                  tickFormatter={(v) => `${v}ms`}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  labelFormatter={(v) => formatClockTime(v as string)}
                  formatter={(v) => [`${v}ms`, "latência"]}
                  contentStyle={{
                    background: "#0f1420",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="latency"
                  stroke="#38bdf8"
                  fill="url(#latencyGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Incidentes recentes"
          subtitle={`${incidents.length} no total`}
          action={
            <Link href="/history" className="text-xs font-medium text-sky-400 hover:text-sky-300">
              Ver histórico completo →
            </Link>
          }
        />
        <div className="divide-y divide-white/5">
          {recentIncidents.map((incident) => (
            <div key={incident.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate text-rose-300">{incident.cause}</p>
                <p className="text-xs text-slate-500">
                  {formatRelativeTime(incident.startedAt)}
                  {incident.resolvedAt
                    ? ` · durou ${formatDuration(incident.startedAt, incident.resolvedAt)}`
                    : " · em andamento"}
                </p>
              </div>
              <span
                className={
                  incident.resolvedAt ? "text-xs text-emerald-400" : "text-xs text-rose-400"
                }
              >
                {incident.resolvedAt ? "Resolvido" : "Ativo"}
              </span>
            </div>
          ))}
          {recentIncidents.length === 0 && <EmptyState label="Nenhum incidente registrado 🎉" />}
        </div>
      </Card>
    </div>
  );
}
