"use client";

import { useControlCenter } from "@/lib/store-context";
import { formatRelativeTime } from "@/lib/format";
import { Card, CardHeader, EmptyState } from "@/components/ui-primitives";
import { ScopeBadge } from "@/components/badges";

export default function PermissionsPage() {
  const { agents, tools, permissions, loading } = useControlCenter();

  if (loading) return <EmptyState label="Loading permissions…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Permissions</h1>
        <p className="mt-1 text-sm text-slate-400">
          Which tools each agent can call, at what scope, and whether human approval is required.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {agents.map((agent) => {
          const grants = permissions.filter((p) => p.agentId === agent.id);
          return (
            <Card key={agent.id}>
              <CardHeader
                title={agent.name}
                subtitle={`${grants.length} tool grant${grants.length === 1 ? "" : "s"} · ${agent.model}`}
              />
              <div className="divide-y divide-white/5">
                {grants.map((grant) => {
                  const tool = tools.find((t) => t.id === grant.toolId);
                  return (
                    <div key={grant.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        <code className="text-slate-300">{tool?.name}</code>
                        <ScopeBadge scope={grant.scope} />
                      </div>
                      <span className="text-xs text-slate-500">
                        {grant.requiresApproval ? "Requires approval" : "Auto-approved"}
                      </span>
                    </div>
                  );
                })}
                {grants.length === 0 && <EmptyState label="No tools granted" />}
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Grant audit log" subtitle={`${permissions.length} total grants`} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Tool</th>
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Granted by</th>
                <th className="px-4 py-3 font-medium">Granted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {permissions.map((grant) => {
                const agent = agents.find((a) => a.id === grant.agentId);
                const tool = tools.find((t) => t.id === grant.toolId);
                return (
                  <tr key={grant.id}>
                    <td className="px-4 py-3 text-slate-300">{agent?.name}</td>
                    <td className="px-4 py-3">
                      <code className="text-slate-300">{tool?.name}</code>
                    </td>
                    <td className="px-4 py-3">
                      <ScopeBadge scope={grant.scope} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={grant.status === "active" ? "text-emerald-400" : "text-slate-500"}>
                        {grant.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{grant.grantedBy}</td>
                    <td className="px-4 py-3 text-slate-500">{formatRelativeTime(grant.grantedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
