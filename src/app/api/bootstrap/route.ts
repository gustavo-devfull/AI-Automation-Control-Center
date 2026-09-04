import { NextResponse } from "next/server";
import { getEngine } from "@/lib/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const engine = getEngine();
  return NextResponse.json({
    agents: engine.agents,
    tools: engine.tools,
    permissions: engine.permissions,
    runs: engine.listRuns(),
    approvals: engine.listApprovals(),
    costs: engine.listCosts(),
    errors: engine.listErrors(),
    retries: engine.listRetries(),
  });
}
