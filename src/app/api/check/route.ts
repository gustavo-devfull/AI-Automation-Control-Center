import { NextResponse } from "next/server";
import { getMonitor } from "@/lib/monitor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const monitor = getMonitor();
  const result = await monitor.performCheck();
  return NextResponse.json({ result });
}
