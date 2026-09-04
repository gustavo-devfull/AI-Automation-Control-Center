"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useControlCenter } from "@/lib/store-context";
import { formatClockTime, formatUsd } from "@/lib/format";
import { Card, CardHeader, EmptyState, StatCard } from "@/components/ui-primitives";

export default function CostsPage() {
  const { costs, agents, runs, loading } = useControlCenter();

  const cumulative = useMemo(() => {
    const points: { time: string; cumulative: number }[] = [];
    let running = 0;
    for (const c of costs) {
      running += c.costUsd;
      points.push({ time: c.timestamp, cumulative: running });
    }
    return points;
  }, [costs]);

  if (loading) return <EmptyState label="Loading cost data…" />;

  const totalSpend = costs.reduce((s, c) => s + c.costUsd, 0);
  const totalTokens = costs.reduce((s, c) => s + c.inputTokens + c.outputTokens, 0);
  const avgPerRun = runs.length ? totalSpend / runs.length : 0;

  const byAgent = agents
    .map((agent) => {
      const agentCosts = costs.filter((c) => c.agentId === agent.id);
      return {
        name: agent.name.replace(" Agent", ""),
        spend: agentCosts.reduce((s, c) => s + c.costUsd, 0),
        calls: agentCosts.length,
        color: agent.avatarColor,
      };
    })
    .filter((d) => d.calls > 0)
    .sort((a, b) => b.spend - a.spend);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Cost & Usage</h1>
        <p className="mt-1 text-sm text-slate-400">Token spend across every agent and tool call.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total spend" value={formatUsd(totalSpend)} />
        <StatCard label="Total tokens" value={totalTokens.toLocaleString()} />
        <StatCard label="Avg cost / run" value={formatUsd(avgPerRun)} />
      </div>

      <Card>
        <CardHeader title="Cumulative spend" subtitle="Running total across all tool calls" />
        <div className="h-64 px-2 py-3">
          {cumulative.length === 0 ? (
            <EmptyState label="No spend recorded yet" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulative}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
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
                  tickFormatter={(v) => formatUsd(v)}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  labelFormatter={(v) => formatClockTime(v as string)}
                  formatter={(v) => formatUsd(Number(v))}
                  contentStyle={{
                    background: "#0f1420",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="cumulative" stroke="#38bdf8" fill="url(#spendGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Spend by agent" />
        <div className="h-64 px-2 py-3">
          {byAgent.length === 0 ? (
            <EmptyState label="No spend recorded yet" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byAgent}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => formatUsd(v)}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  formatter={(v) => formatUsd(Number(v))}
                  contentStyle={{
                    background: "#0f1420",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="spend" radius={[6, 6, 0, 0]}>
                  {byAgent.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Recent tool calls" subtitle={`${costs.length} logged`} />
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#0b0e14]">
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2 font-medium">Agent</th>
                <th className="px-4 py-2 font-medium">Input tokens</th>
                <th className="px-4 py-2 font-medium">Output tokens</th>
                <th className="px-4 py-2 font-medium">Cost</th>
                <th className="px-4 py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...costs]
                .reverse()
                .slice(0, 40)
                .map((c) => {
                  const agent = agents.find((a) => a.id === c.agentId);
                  return (
                    <tr key={c.id}>
                      <td className="px-4 py-2 text-slate-300">{agent?.name}</td>
                      <td className="px-4 py-2 tabular-nums text-slate-400">{c.inputTokens.toLocaleString()}</td>
                      <td className="px-4 py-2 tabular-nums text-slate-400">{c.outputTokens.toLocaleString()}</td>
                      <td className="px-4 py-2 tabular-nums text-slate-200">{formatUsd(c.costUsd)}</td>
                      <td className="px-4 py-2 text-slate-500">{formatClockTime(c.timestamp)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {costs.length === 0 && <EmptyState label="No tool calls yet" />}
        </div>
      </Card>
    </div>
  );
}
