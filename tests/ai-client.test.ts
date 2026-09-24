import Anthropic from "@anthropic-ai/sdk";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// No real AI calls: the SDK's stream() is replaced with a fake that fails or succeeds on cue.
process.env.ANTHROPIC_API_KEY ??= "test-key";
type Client = typeof import("@/lib/ai/client");
let ai: Client;

type Params = Record<string, unknown> & { output_config?: { format?: unknown } };
type Step = Error | { text: string; stop?: string };

const badRequest = () => new Anthropic.BadRequestError(400, {}, "not accepted", new Headers());
const rateLimited = () => new Anthropic.RateLimitError(429, {}, "busy", new Headers());

let calls: Params[];
function fakeApi(steps: Step[]) {
  calls = [];
  vi.spyOn(ai.anthropic.beta.messages, "stream").mockImplementation(((params: Params) => {
    calls.push(params);
    const step = steps[calls.length - 1];
    const fail = step instanceof Error ? step : null;
    const reply = fail ? null : (step as { text: string; stop?: string });
    const message = {
      content: [{ type: "text", text: reply?.text ?? "" }],
      stop_reason: reply?.stop ?? "end_turn",
    };
    return {
      ended: false,
      abort() {},
      finalMessage: async () => {
        if (fail) throw fail;
        return message;
      },
      async *[Symbol.asyncIterator]() {
        if (fail) throw fail;
        yield { type: "content_block_delta", delta: { type: "text_delta", text: reply!.text } };
      },
    };
  }) as never);
}

const request = {
  max_tokens: 100,
  output_config: { effort: "high" as const, format: { type: "json_schema" as const, schema: {} } },
  messages: [{ role: "user" as const, content: "Hi" }],
};

beforeAll(async () => {
  ai = await import("@/lib/ai/client");
});
beforeEach(() => vi.restoreAllMocks());

describe("AI requests", () => {
  it("asks for Opus 5 in fast mode with fallbacks first", async () => {
    fakeApi([{ text: "{}" }]);
    await ai.createMessage(request);
    expect(calls[0]).toMatchObject({ model: "claude-opus-5", speed: "fast", fallbacks: "default" });
  });

  it("moves to standard speed when fast mode is busy or unavailable", async () => {
    fakeApi([rateLimited(), { text: "{}" }]);
    await ai.createMessage(request);
    expect(calls).toHaveLength(2);
    expect(calls[1].speed).toBeUndefined();
    expect(calls[1].fallbacks).toBe("default");
  });

  it("drops fallbacks, then the schema, when the API rejects them", async () => {
    fakeApi([badRequest(), badRequest(), badRequest(), { text: "{}" }]);
    await ai.createMessage(request);
    expect(calls).toHaveLength(4);
    expect(calls[2].fallbacks).toBeUndefined();
    expect(calls[2].output_config?.format).toBeDefined();
    expect(calls[3].output_config?.format).toBeUndefined();
    expect(calls[3].output_config).toMatchObject({ effort: "high" });
  });

  it("does not retry a rate limit at standard speed itself", async () => {
    fakeApi([rateLimited(), rateLimited()]);
    await expect(ai.createMessage(request)).rejects.toBeInstanceOf(Anthropic.RateLimitError);
    expect(calls).toHaveLength(2);
  });

  it("never retries when the user cancelled", async () => {
    fakeApi([new Anthropic.APIUserAbortError()]);
    await expect(ai.createMessage(request)).rejects.toBeInstanceOf(Anthropic.APIUserAbortError);
    expect(calls).toHaveLength(1);
  });

  it("treats a refusal or a cut-off reply as an error, not an answer", async () => {
    fakeApi([{ text: "", stop: "refusal" }]);
    await expect(ai.createMessage(request)).rejects.toBeInstanceOf(ai.AiRefusedError);
    fakeApi([{ text: '{"a":', stop: "max_tokens" }]);
    await expect(ai.createMessage(request)).rejects.toBeInstanceOf(ai.AiTruncatedError);
  });

  it("streams text, stepping down the same way before any text arrives", async () => {
    fakeApi([rateLimited(), { text: "Hello" }]);
    const pieces: string[] = [];
    for await (const piece of ai.streamText(request)) pieces.push(piece);
    expect(pieces).toEqual(["Hello"]);
    expect(calls).toHaveLength(2);
  });

  it("reports a streamed refusal after the text", async () => {
    fakeApi([{ text: "partial", stop: "refusal" }]);
    const read = async () => {
      for await (const piece of ai.streamText(request)) void piece;
    };
    await expect(read()).rejects.toBeInstanceOf(ai.AiRefusedError);
  });
});
