"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Clock, DollarSign, ShieldCheck } from "lucide-react";
import { useControlCenter } from "@/lib/store-context";
import { formatRelativeTime, formatUsd } from "@/lib/format";
import { Card, CardHeader, StatCard, Button, EmptyState } from "@/components/ui-primitives";
import { StatusBadge, RiskBadge } from "@/components/badges";

const STATUS_COLORS: Record<string, string> = {
  queued: "#64748b",
  running: "#38bdf8",
  awaiting_approval: "#fbbf24",
  retrying: "#fb923c",
  succeeded: "#34d399",
  failed: "#fb7185",
  denied: "#fb7185",
};

export default function OverviewPage() {
  const { runs, agents, approvals, costs, errors, decideApproval, loading } =
    useControlCenter();

  if (loading) {
    return <EmptyState label="Loading control center…" />;
  }

  const activeRuns = runs.filter((r) =>
    ["running", "retrying", "queued", "awaiting_approval"].includes(r.status)
  );
  const finished = runs.filter((r) => ["succeeded", "failed", "denied"].includes(r.status));
  const successRate = finished.length
    ? Math.round((finished.filter((r) => r.status === "succeeded").length / finished.length) * 100)
    : 100;
  const totalSpend = costs.reduce((sum, c) => sum + c.costUsd, 0);
  const pendingApprovals = approvals.filter((a) => a.decision === "pending");
  const recentErrors = errors.slice(0, 6);

  const costByAgent = agents
    .map((agent) => ({
      name: agent.name.replace(" Agent", ""),
      value: costs.filter((c) => c.agentId === agent.id).reduce((s, c) => s + c.costUsd, 0),
      color: agent.avatarColor,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const statusCounts: Record<string, number> = {};
  for (const r of runs) statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
  const statusData = Object.entries(statusCounts).map(([status, value]) => ({
    status,
    value,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Overview</h1>
        <p className="mt-1 text-sm text-slate-400">
          Live operational view of every autonomous agent run across your fleet.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Runs"
          value={String(activeRuns.length)}
          delta={`${runs.length} total`}
          icon={<Clock size={16} />}
        />
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
          delta={`${finished.length} completed`}
          deltaTone={successRate >= 80 ? "positive" : "negative"}
          icon={<ShieldCheck size={16} />}
        />
        <StatCard
          label="Total Spend"
          value={formatUsd(totalSpend)}
          delta={`${costs.length} tool calls`}
          icon={<DollarSign size={16} />}
        />
        <StatCard
          label="Pending Approvals"
          value={String(pendingApprovals.length)}
          delta={pendingApprovals.length > 0 ? "Needs review" : "All clear"}
          deltaTone={pendingApprovals.length > 0 ? "negative" : "positive"}
          icon={<AlertTriangle size={16} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Spend by agent" subtitle="Cumulative cost across all runs" />
          <div className="h-56 px-2 py-3">
            {costByAgent.length === 0 ? (
              <EmptyState label="No spend recorded yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costByAgent} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
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
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {costByAgent.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Run status" subtitle={`${runs.length} runs total`} />
          <div className="h-56 px-2 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="status"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {statusData.map((d, i) => (
                    <Cell key={i} fill={STATUS_COLORS[d.status] ?? "#64748b"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f1420",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent runs"
            subtitle="Latest agent executions"
            action={
              <Link href="/runs" className="text-xs font-medium text-sky-400 hover:text-sky-300">
                View all →
              </Link>
            }
          />
          <div className="divide-y divide-white/5">
            {runs.slice(0, 6).map((run) => {
              const agent = agents.find((a) => a.id === run.agentId);
              return (
                <Link
                  key={run.id}
                  href={`/runs/${run.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: agent?.avatarColor }}
                      />
                      <span className="truncate text-slate-200">{run.task}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {agent?.name} · {formatRelativeTime(run.startedAt)}
                    </p>
                  </div>
                  <StatusBadge status={run.status} />
                </Link>
              );
            })}
            {runs.length === 0 && <EmptyState label="No runs yet" />}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Pending approvals"
            action={
              <Link href="/approvals" className="text-xs font-medium text-sky-400 hover:text-sky-300">
                View all →
              </Link>
            }
          />
          <div className="divide-y divide-white/5">
            {pendingApprovals.slice(0, 4).map((approval) => (
              <div key={approval.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-slate-200">{approval.action}</p>
                  <RiskBadge risk={approval.riskLevel} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{approval.reason}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="success" onClick={() => decideApproval(approval.id, "approved")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => decideApproval(approval.id, "denied")}>
                    Deny
                  </Button>
                </div>
              </div>
            ))}
            {pendingApprovals.length === 0 && <EmptyState label="No pending approvals" />}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent errors"
          subtitle="Most recent failures across all runs"
          action={
            <Link href="/errors" className="text-xs font-medium text-sky-400 hover:text-sky-300">
              View all →
            </Link>
          }
        />
        <div className="divide-y divide-white/5">
          {recentErrors.map((error) => (
            <div key={error.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate text-rose-300">{error.message}</p>
                <p className="text-xs text-slate-500">
                  attempt {error.retryAttempt} · {formatRelativeTime(error.timestamp)}
                </p>
              </div>
              <Link href={`/runs/${error.runId}`} className="shrink-0 text-xs text-sky-400 hover:text-sky-300">
                View run
              </Link>
            </div>
          ))}
          {recentErrors.length === 0 && <EmptyState label="No errors recorded" />}
        </div>
      </Card>
    </div>
  );
}
