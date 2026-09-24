import { describe, expect, it } from "vitest";
import { ChatRequestSchema, MAX_HISTORY } from "@/types/chat";

const question = { role: "user" as const, content: "What's gluten-free?" };

describe("ChatRequestSchema", () => {
  it("accepts a valid question", () => {
    expect(ChatRequestSchema.safeParse({ language: "ko", messages: [question] }).success).toBe(
      true,
    );
  });

  it("rejects an unsupported language", () => {
    expect(ChatRequestSchema.safeParse({ language: "xx", messages: [question] }).success).toBe(
      false,
    );
  });

  it("rejects a conversation that doesn't end with the diner's question", () => {
    const messages = [question, { role: "assistant", content: "The salad." }];
    expect(ChatRequestSchema.safeParse({ language: "en", messages }).success).toBe(false);
  });

  it("rejects questions over 500 characters", () => {
    const long = { role: "user", content: "a".repeat(501) };
    expect(ChatRequestSchema.safeParse({ language: "en", messages: [long] }).success).toBe(false);
  });

  it("rejects conversations longer than the history limit", () => {
    const messages = Array.from({ length: MAX_HISTORY + 1 }, () => question);
    expect(ChatRequestSchema.safeParse({ language: "en", messages }).success).toBe(false);
  });
});
