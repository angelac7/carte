import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-5";
export const anthropic = new Anthropic();

type ModelReply = { content: ReadonlyArray<{ type: string; text?: string }> };

/** Pulls the JSON out of a model reply, tolerating ```json fences. */
export function parseJsonReply(reply: ModelReply): unknown {
  const text = reply.content
    .map((block) => (block.type === "text" ? (block.text ?? "") : ""))
    .join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
