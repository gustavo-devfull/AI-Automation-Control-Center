import { getEngine } from "@/lib/engine";
import type { ControlCenterEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const engine = getEngine();
  const encoder = new TextEncoder();

  let onEvent: (event: ControlCenterEvent) => void;
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: ControlCenterEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // controller already closed
        }
      };

      onEvent = send;
      engine.emitter.on("event", onEvent);

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
      engine.emitter.off("event", onEvent);
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
