"use client";

import { useMonitor } from "@/lib/store-context";
import { formatClockTime, formatDuration, formatRelativeTime } from "@/lib/format";
import { Card, CardHeader, EmptyState } from "@/components/ui-primitives";
import { CheckRowBadge } from "@/components/badges";

export default function HistoryPage() {
  const { checks, incidents, loading } = useMonitor();

  if (loading) return <EmptyState label="Carregando histórico…" />;

  const orderedChecks = [...checks].reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Histórico</h1>
        <p className="mt-1 text-sm text-slate-400">
          Checagens brutas e incidentes registrados desde que este processo iniciou.
        </p>
      </div>

      <Card>
        <CardHeader title="Incidentes" subtitle={`${incidents.length} no total`} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Causa</th>
                <th className="px-4 py-3 font-medium">Início</th>
                <th className="px-4 py-3 font-medium">Duração</th>
                <th className="px-4 py-3 font-medium">Checagens falhas</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {incidents.map((incident) => (
                <tr key={incident.id}>
                  <td className="px-4 py-3 text-slate-300">{incident.cause}</td>
                  <td className="px-4 py-3 text-slate-400">{formatRelativeTime(incident.startedAt)}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-400">
                    {incident.resolvedAt ? formatDuration(incident.startedAt, incident.resolvedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-400">{incident.checksFailed}</td>
                  <td className="px-4 py-3">
                    <span className={incident.resolvedAt ? "text-emerald-400" : "text-rose-400"}>
                      {incident.resolvedAt ? "Resolvido" : "Ativo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {incidents.length === 0 && <EmptyState label="Nenhum incidente registrado" />}
        </div>
      </Card>

      <Card>
        <CardHeader title="Checagens" subtitle={`${checks.length} registradas`} />
        <div className="max-h-[32rem] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#0b0e14]">
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2 font-medium">Horário</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">HTTP</th>
                <th className="px-4 py-2 font-medium">Latência</th>
                <th className="px-4 py-2 font-medium">Erro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orderedChecks.slice(0, 300).map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 text-slate-400">{formatClockTime(c.timestamp)}</td>
                  <td className="px-4 py-2">
                    <CheckRowBadge success={c.success} />
                  </td>
                  <td className="px-4 py-2 tabular-nums text-slate-300">{c.statusCode ?? "—"}</td>
                  <td className="px-4 py-2 tabular-nums text-slate-300">
                    {c.latencyMs !== null ? `${c.latencyMs}ms` : "—"}
                  </td>
                  <td className="px-4 py-2 text-rose-300">{c.error ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {checks.length === 0 && <EmptyState label="Nenhuma checagem registrada ainda" />}
        </div>
      </Card>
    </div>
  );
}
