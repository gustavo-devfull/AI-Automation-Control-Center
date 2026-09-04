"use client";

import Link from "next/link";
import { useControlCenter } from "@/lib/store-context";
import { formatRelativeTime } from "@/lib/format";
import { Card, CardHeader, EmptyState, StatCard } from "@/components/ui-primitives";

export default function ErrorsPage() {
  const { errors, retries, runs, agents, loading } = useControlCenter();

  if (loading) return <EmptyState label="Loading error data…" />;

  const failedRuns = runs.filter((r) => r.status === "failed").length;
  const retriedSuccessfully = runs.filter(
    (r) => r.retryCount > 0 && r.status === "succeeded"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Errors & Retries</h1>
        <p className="mt-1 text-sm text-slate-400">
          Failure signals across the fleet and the retry backoff behavior handling them.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total errors" value={String(errors.length)} deltaTone="negative" />
        <StatCard label="Total retries" value={String(retries.length)} />
        <StatCard
          label="Recovered after retry"
          value={String(retriedSuccessfully)}
          delta={`${failedRuns} failed permanently`}
          deltaTone="positive"
        />
      </div>

      <Card>
        <CardHeader title="Error log" subtitle={`${errors.length} events`} />
        <div className="divide-y divide-white/5">
          {errors.map((e) => {
            const run = runs.find((r) => r.id === e.runId);
            const agent = agents.find((a) => a.id === run?.agentId);
            return (
              <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-rose-300">{e.message}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {agent?.name} · attempt {e.retryAttempt} · {formatRelativeTime(e.timestamp)}
                  </p>
                </div>
                <Link href={`/runs/${e.runId}`} className="shrink-0 text-xs text-sky-400 hover:text-sky-300">
                  View run
                </Link>
              </div>
            );
          })}
          {errors.length === 0 && <EmptyState label="No errors recorded" />}
        </div>
      </Card>

      <Card>
        <CardHeader title="Retry timeline" subtitle={`${retries.length} attempts`} />
        <div className="divide-y divide-white/5">
          {retries.map((r) => {
            const run = runs.find((run) => run.id === r.runId);
            const agent = agents.find((a) => a.id === run?.agentId);
            return (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-orange-300">
                    Attempt {r.attempt} · backoff {r.backoffMs}ms
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {agent?.name} · {r.reason}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate-500">{formatRelativeTime(r.timestamp)}</span>
              </div>
            );
          })}
          {retries.length === 0 && <EmptyState label="No retries recorded" />}
        </div>
      </Card>
    </div>
  );
}
