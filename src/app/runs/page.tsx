"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useControlCenter } from "@/lib/store-context";
import { formatDuration, formatRelativeTime, formatUsd } from "@/lib/format";
import { Card, EmptyState, ProgressBar } from "@/components/ui-primitives";
import { StatusBadge } from "@/components/badges";
import { cn } from "@/lib/utils";
import type { RunStatus } from "@/lib/types";

const STATUS_FILTERS: { label: string; value: RunStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Running", value: "running" },
  { label: "Awaiting approval", value: "awaiting_approval" },
  { label: "Retrying", value: "retrying" },
  { label: "Succeeded", value: "succeeded" },
  { label: "Failed", value: "failed" },
  { label: "Denied", value: "denied" },
];

export default function RunsPage() {
  const { runs, agents, loading } = useControlCenter();
  const [statusFilter, setStatusFilter] = useState<RunStatus | "all">("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return runs.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (agentFilter !== "all" && r.agentId !== agentFilter) return false;
      return true;
    });
  }, [runs, statusFilter, agentFilter]);

  if (loading) return <EmptyState label="Loading runs…" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Agent Runs</h1>
          <p className="mt-1 text-sm text-slate-400">{filtered.length} of {runs.length} runs</p>
        </div>
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200"
        >
          <option value="all">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              statusFilter === f.value
                ? "border-sky-400/40 bg-sky-500/15 text-sky-300"
                : "border-white/10 text-slate-400 hover:text-slate-200"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Retries</th>
                <th className="px-4 py-3 font-medium">Cost</th>
                <th className="px-4 py-3 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((run) => {
                const agent = agents.find((a) => a.id === run.agentId);
                return (
                  <tr key={run.id} className="hover:bg-white/5">
                    <td className="max-w-xs px-4 py-3">
                      <Link href={`/runs/${run.id}`} className="block truncate text-slate-200 hover:text-sky-300">
                        {run.task}
                      </Link>
                      <p className="text-xs text-slate-500">{formatRelativeTime(run.startedAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: agent?.avatarColor }} />
                        <span className="text-slate-300">{agent?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-28">
                        <ProgressBar
                          value={run.progress}
                          tone={run.status === "failed" || run.status === "denied" ? "rose" : run.status === "succeeded" ? "emerald" : "sky"}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-300">{run.retryCount}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-300">{formatUsd(run.totalCostUsd)}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-300">
                      {formatDuration(run.startedAt, run.finishedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState label="No runs match these filters" />}
        </div>
      </Card>
    </div>
  );
}
