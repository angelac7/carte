import "server-only";

/**
 * Streams events to the browser as JSON lines, one event per line, as they happen.
 * If the browser disconnects, the event source is stopped too.
 */
export function ndjsonResponse(events: AsyncIterable<unknown>): Response {
  const encoder = new TextEncoder();
  const iterator = events[Symbol.asyncIterator]();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) controller.close();
      else controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
    },
    async cancel() {
      await iterator.return?.();
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      // Keeps proxies from holding lines back until the response ends.
      "X-Accel-Buffering": "no",
    },
  });
}
