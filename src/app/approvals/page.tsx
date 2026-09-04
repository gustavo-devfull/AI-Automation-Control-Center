"use client";

import Link from "next/link";
import { useControlCenter } from "@/lib/store-context";
import { formatRelativeTime } from "@/lib/format";
import { Card, EmptyState, Button } from "@/components/ui-primitives";
import { RiskBadge } from "@/components/badges";
import { cn } from "@/lib/utils";

export default function ApprovalsPage() {
  const { approvals, agents, runs, decideApproval, loading } = useControlCenter();

  if (loading) return <EmptyState label="Loading approvals…" />;

  const pending = approvals.filter((a) => a.decision === "pending");
  const decided = approvals
    .filter((a) => a.decision !== "pending")
    .sort((a, b) => new Date(b.decidedAt ?? 0).getTime() - new Date(a.decidedAt ?? 0).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Human Approval Queue</h1>
        <p className="mt-1 text-sm text-slate-400">
          High-risk tool calls pause here until a human reviews and decides.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <Card>
            <EmptyState label="Nothing waiting on you right now" />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {pending.map((approval) => {
              const agent = agents.find((a) => a.id === approval.agentId);
              const run = runs.find((r) => r.id === approval.runId);
              return (
                <Card key={approval.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: agent?.avatarColor }} />
                      <p className="text-sm font-medium text-white">{agent?.name}</p>
                    </div>
                    <RiskBadge risk={approval.riskLevel} />
                  </div>
                  <p className="mt-2 text-sm text-slate-200">{approval.action}</p>
                  <p className="mt-1 text-xs text-slate-500">{approval.reason}</p>
                  {run && (
                    <Link href={`/runs/${run.id}`} className="mt-1 block text-xs text-sky-400 hover:text-sky-300">
                      From run: {run.task}
                    </Link>
                  )}
                  <p className="mt-2 text-xs text-slate-600">Requested {formatRelativeTime(approval.createdAt)}</p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="success" size="sm" onClick={() => decideApproval(approval.id, "approved")}>
                      Approve
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => decideApproval(approval.id, "denied")}>
                      Deny
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Decision history</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 font-medium">Decision</th>
                  <th className="px-4 py-3 font-medium">Decided by</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {decided.map((approval) => {
                  const agent = agents.find((a) => a.id === approval.agentId);
                  return (
                    <tr key={approval.id}>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-300">{approval.action}</td>
                      <td className="px-4 py-3 text-slate-300">{agent?.name}</td>
                      <td className="px-4 py-3">
                        <RiskBadge risk={approval.riskLevel} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            approval.decision === "approved" ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {approval.decision === "approved" ? "Approved" : "Denied"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{approval.decidedBy}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {approval.decidedAt ? formatRelativeTime(approval.decidedAt) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {decided.length === 0 && <EmptyState label="No decisions yet" />}
          </div>
        </Card>
      </div>
    </div>
  );
}
