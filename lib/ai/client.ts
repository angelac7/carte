import Anthropic from "@anthropic-ai/sdk";
import type {
  BetaMessage,
  MessageCreateParamsBase,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";

export const MODEL = "claude-opus-5";
export const anthropic = new Anthropic();

/** A request without the settings chosen here: model, speed, betas, and fallbacks. */
export type AiRequest = Omit<
  MessageCreateParamsBase,
  "model" | "stream" | "betas" | "speed" | "fallbacks"
>;

/** The AI declined the request, even after trying a fallback model. */
export class AiRefusedError extends Error {}
/** The reply hit its token limit before finishing. */
export class AiTruncatedError extends Error {}

type Attempt = {
  label: string;
  extras: Partial<MessageCreateParamsBase>;
  /** Keep the JSON schema in output_config.format. */
  schema: boolean;
  maxRetries?: number;
};

// Tried in order until the API accepts one. Fast mode is a research preview and fallbacks
// are a beta, so either may be unavailable for an account; and a schema the API rejects
// shouldn't take a feature down, since every prompt also asks for JSON in plain words.
const ATTEMPTS: Attempt[] = [
  {
    label: "fast",
    extras: {
      speed: "fast",
      betas: ["fast-mode-2026-02-01", "server-side-fallback-2026-07-01"],
      fallbacks: "default",
    },
    schema: true,
    // Fast mode has its own rate limit; if it's busy, move straight to standard speed.
    maxRetries: 0,
  },
  {
    label: "standard",
    extras: { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" },
    schema: true,
  },
  { label: "without fallbacks", extras: {}, schema: true },
  { label: "without a schema", extras: {}, schema: false },
];

function attemptsFor(request: AiRequest): Attempt[] {
  return request.output_config?.format ? ATTEMPTS : ATTEMPTS.filter((attempt) => attempt.schema);
}

function build(request: AiRequest, attempt: Attempt): MessageCreateParamsBase {
  const { output_config, ...rest } = request;
  const config = attempt.schema ? output_config : { ...output_config, format: undefined };
  return { model: MODEL, ...rest, ...(config ? { output_config: config } : {}), ...attempt.extras };
}

function shouldTryNext(err: unknown, attempt: Attempt): boolean {
  if (err instanceof Anthropic.APIUserAbortError) return false;
  // Anything can send fast mode to standard speed; later steps only skip requests the API rejects.
  if (attempt.label === "fast") return err instanceof Anthropic.APIError;
  return err instanceof Anthropic.BadRequestError;
}

function note(attempt: Attempt, err: unknown) {
  const reason =
    err instanceof Anthropic.APIError ? `${err.status ?? "network"} ${err.message}` : err;
  console.warn(`AI request retried after "${attempt.label}" was not accepted:`, reason);
}

/** Refusals and cut-off replies must never be read as a normal answer. */
function checkStop(message: BetaMessage) {
  if (message.stop_reason === "refusal") throw new AiRefusedError("The AI declined this request.");
  if (message.stop_reason === "max_tokens") throw new AiTruncatedError("The AI reply was cut off.");
}

/**
 * Sends a request and returns the finished reply. Streams under the hood so long replies
 * never hit an HTTP timeout. Throws AiRefusedError or AiTruncatedError if it didn't finish.
 */
export async function createMessage(request: AiRequest): Promise<BetaMessage> {
  const attempts = attemptsFor(request);
  for (const [index, attempt] of attempts.entries()) {
    try {
      const message = await anthropic.beta.messages
        .stream(build(request, attempt), { maxRetries: attempt.maxRetries })
        .finalMessage();
      checkStop(message);
      return message;
    } catch (err) {
      if (index === attempts.length - 1 || !shouldTryNext(err, attempt)) throw err;
      note(attempt, err);
    }
  }
  throw new Error("No AI request was attempted.");
}

/**
 * Yields the reply's text as it's written. Stops the request if `signal` aborts or the
 * caller stops reading. Throws AiRefusedError or AiTruncatedError if it didn't finish.
 */
export async function* streamText(
  request: AiRequest,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const attempts = attemptsFor(request);
  for (const [index, attempt] of attempts.entries()) {
    const stream = anthropic.beta.messages.stream(build(request, attempt), {
      signal,
      maxRetries: attempt.maxRetries,
    });
    const events = stream[Symbol.asyncIterator]();
    let next: Awaited<ReturnType<typeof events.next>>;
    try {
      // Rejected requests fail here, before any text, so the next step can take over cleanly.
      next = await events.next();
    } catch (err) {
      if (index === attempts.length - 1 || !shouldTryNext(err, attempt)) throw err;
      note(attempt, err);
      continue;
    }
    try {
      for (; !next.done; next = await events.next()) {
        const event = next.value;
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield event.delta.text;
        }
      }
      checkStop(await stream.finalMessage());
      return;
    } finally {
      if (!stream.ended) stream.abort();
    }
  }
}

type ModelReply = { content: ReadonlyArray<{ type: string; text?: string }> };

/** Pulls the JSON out of a model reply, tolerating ```json fences. */
export function parseJsonReply(reply: ModelReply): unknown {
  const text = reply.content
    .map((block) => (block.type === "text" ? (block.text ?? "") : ""))
    .join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
