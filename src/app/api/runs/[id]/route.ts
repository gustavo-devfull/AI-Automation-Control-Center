import { NextResponse } from "next/server";
import { getEngine } from "@/lib/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const engine = getEngine();
  const run = engine.getRun(id);

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  return NextResponse.json({
    run,
    logs: engine.getLogs(id),
    costs: engine.listCosts().filter((c) => c.runId === id),
    errors: engine.listErrors().filter((e) => e.runId === id),
    retries: engine.listRetries().filter((r) => r.runId === id),
  });
}
