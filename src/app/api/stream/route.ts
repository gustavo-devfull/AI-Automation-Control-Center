import { getMonitor } from "@/lib/monitor";
import type { MonitorEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const monitor = getMonitor();
  const encoder = new TextEncoder();

  let onEvent: (event: MonitorEvent) => void;
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: MonitorEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // controller already closed
        }
      };

      onEvent = send;
      monitor.emitter.on("event", onEvent);

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          // ignore
        }
      }, 15000);

      controller.enqueue(encoder.encode(`: connected\n\n`));
    },
    cancel() {
      monitor.emitter.off("event", onEvent);
      clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
