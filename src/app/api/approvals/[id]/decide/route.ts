import { NextResponse } from "next/server";
import { getEngine } from "@/lib/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const decision = body.decision === "denied" ? "denied" : "approved";
  const decidedBy = typeof body.decidedBy === "string" ? body.decidedBy : "You (operator)";

  const engine = getEngine();
  const approval = engine.decideApproval(id, decision, decidedBy);

  if (!approval) {
    return NextResponse.json(
      { error: "Approval not found or already decided" },
      { status: 404 }
    );
  }

  return NextResponse.json({ approval });
}
