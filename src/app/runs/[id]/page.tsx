"use client";

import { use, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRunDetail } from "@/lib/use-run-detail";
import { useControlCenter } from "@/lib/store-context";
import { formatClockTime, formatDuration, formatRelativeTime, formatUsd } from "@/lib/format";
import { Card, CardHeader, EmptyState, ProgressBar, Button } from "@/components/ui-primitives";
import { StatusBadge, LogLevelTag } from "@/components/badges";

export default function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { run, logs, costs, errors, retries, loading } = useRunDetail(id);
  const { agents, decideApproval, approvals } = useControlCenter();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  if (loading) return <EmptyState label="Loading run…" />;
  if (!run) return <EmptyState label="Run not found" />;

  const agent = agents.find((a) => a.id === run.agentId);
  const approval = approvals.find((a) => a.runId === run.id && a.decision === "pending");

  return (
    <div className="space-y-4">
      <Link href="/runs" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft size={14} /> Back to runs
      </Link>

      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: agent?.avatarColor }} />
              <h1 className="text-lg font-semibold text-white">{run.task}</h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {agent?.name} · {agent?.model} · started {formatRelativeTime(run.startedAt)}
            </p>
          </div>
          <StatusBadge status={run.status} />
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>{run.currentStep ?? "—"}</span>
            <span>{run.progress}%</span>
          </div>
          <ProgressBar
            value={run.progress}
            tone={run.status === "failed" || run.status === "denied" ? "rose" : run.status === "succeeded" ? "emerald" : "sky"}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Duration</p>
            <p className="text-sm font-medium text-slate-200">{formatDuration(run.startedAt, run.finishedAt)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Cost</p>
            <p className="text-sm font-medium text-slate-200">{formatUsd(run.totalCostUsd)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Tokens</p>
            <p className="text-sm font-medium text-slate-200">{run.totalTokens.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Retries</p>
            <p className="text-sm font-medium text-slate-200">{run.retryCount}</p>
          </div>
        </div>

        {approval && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
            <p className="text-sm text-amber-200">{approval.reason}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="success" onClick={() => decideApproval(approval.id, "approved")}>
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => decideApproval(approval.id, "denied")}>
                Deny
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Live logs" subtitle={`${logs.length} entries`} />
        <div className="h-80 overflow-y-auto bg-black/30 px-4 py-3 font-mono text-xs leading-relaxed">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 py-0.5">
              <span className="shrink-0 text-slate-600">{formatClockTime(log.timestamp)}</span>
              <span className="w-10 shrink-0">
                <LogLevelTag level={log.level} />
              </span>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && <p className="py-8 text-center text-slate-600">No log entries yet</p>}
          <div ref={logEndRef} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Cost breakdown" subtitle={`${costs.length} tool calls`} />
          <div className="max-h-64 divide-y divide-white/5 overflow-y-auto">
            {costs.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <p className="text-slate-300">
                    {c.inputTokens.toLocaleString()} in / {c.outputTokens.toLocaleString()} out
                  </p>
                  <p className="text-xs text-slate-500">{formatRelativeTime(c.timestamp)}</p>
                </div>
                <p className="tabular-nums text-slate-200">{formatUsd(c.costUsd)}</p>
              </div>
            ))}
            {costs.length === 0 && <EmptyState label="No cost recorded" />}
          </div>
        </Card>

        <Card>
          <CardHeader title="Errors & retries" subtitle={`${errors.length} errors · ${retries.length} retries`} />
          <div className="max-h-64 divide-y divide-white/5 overflow-y-auto">
            {errors.map((e) => (
              <div key={e.id} className="px-4 py-2 text-sm">
                <p className="text-rose-300">{e.message}</p>
                <p className="text-xs text-slate-500">
                  attempt {e.retryAttempt} · {formatRelativeTime(e.timestamp)}
                </p>
              </div>
            ))}
            {errors.length === 0 && <EmptyState label="No errors on this run" />}
          </div>
        </Card>
      </div>
    </div>
  );
}
