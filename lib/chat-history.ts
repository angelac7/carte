import { MAX_HISTORY, type ChatMessage } from "@/types/chat";

/** Keep displayed answers intact while bounding the context sent with follow-up questions. */
export function prepareChatHistory(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .slice(-MAX_HISTORY)
    .map((message) =>
      message.role === "assistant"
        ? { ...message, content: message.content.slice(0, 2000) }
        : message,
    );
}
