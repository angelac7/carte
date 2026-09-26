import { z } from "zod";
import { ALLERGENS, DIETARY_TAGS, OTHER_AVOIDS } from "@/lib/allergens";
import { isLanguageCode, type LanguageCode } from "@/lib/languages";

export const MAX_QUESTION_LENGTH = 500;
export const MAX_HISTORY = 10;

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export const ChatRequestSchema = z.object({
  avoid: z.array(z.enum(ALLERGENS)).default([]),
  onlyTags: z.array(z.enum(DIETARY_TAGS)).default([]),
  alsoAvoid: z.array(z.enum(OTHER_AVOIDS)).max(OTHER_AVOIDS.length).default([]),
  language: z.custom<LanguageCode>((value) => typeof value === "string" && isLanguageCode(value)),
  messages: z
    .array(ChatMessageSchema)
    .min(1)
    .max(MAX_HISTORY)
    .refine((messages) => messages[messages.length - 1].role === "user", {
      message: "The last message must be the diner's question.",
    })
    .refine(
      (messages) =>
        messages.every((m) => m.role !== "user" || m.content.length <= MAX_QUESTION_LENGTH),
      { message: "Questions must be 500 characters or fewer." },
    ),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/** Events from /api/chat while an answer is written: pieces of text, then "done" or an error. */
export const ChatStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("done") }),
  z.object({ type: z.literal("error") }),
]);

export type ChatStreamEvent = z.input<typeof ChatStreamEventSchema>;
