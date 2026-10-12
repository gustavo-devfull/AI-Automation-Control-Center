import { NextResponse } from "next/server";
import { getMonitor } from "@/lib/monitor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const monitor = getMonitor();
  await monitor.ensureFresh();
  return NextResponse.json(monitor.snapshot());
}
