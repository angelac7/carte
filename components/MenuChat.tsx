"use client";
import { useEffect, useRef, useState } from "react";
import { askMenu, ChatLimitError } from "@/lib/api-client";
import { CHAT_STRINGS } from "@/lib/i18n/chat-strings";
import type { LanguageCode } from "@/lib/languages";
import { MAX_QUESTION_LENGTH, type ChatMessage } from "@/types/chat";

/** A chat panel where diners ask questions answered from the confirmed menu. */
export function MenuChat({ language }: { language: LanguageCode }) {
  const t = CHAT_STRINGS[language];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || sending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setDraft("");
    setProblem("");
    setSending(true);
    try {
      const reply = await askMenu(language, next);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      setProblem(err instanceof ChatLimitError ? t.limit : t.error);
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-20 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-ink/90 print:hidden"
      >
        {t.open}
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-label={t.title}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      className="fixed inset-x-0 bottom-0 z-20 flex max-h-[80vh] flex-col rounded-t-xl border border-line bg-card shadow-2xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96 sm:rounded-xl print:hidden"
    >
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-serif text-lg">{t.title}</h2>
        <button onClick={() => setOpen(false)} className="text-sm text-muted hover:text-ink">
          {t.close}
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        <p className="text-sm leading-relaxed text-muted">{t.intro}</p>

        {messages.length === 0 && (
          <div className="flex flex-col items-start gap-2">
            {t.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => ask(suggestion)}
                className="rounded-full border border-line px-3 py-1.5 text-left text-sm hover:border-muted"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {messages.map((message, index) => (
          <p
            key={index}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${
              message.role === "user" ? "ml-auto bg-ink text-white" : "bg-paper"
            }`}
          >
            {message.content}
          </p>
        ))}

        {sending && <p className="text-sm text-muted">{t.thinking}</p>}
        {problem && (
          <p role="alert" className="text-sm text-tomato">
            {problem}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
        className="flex gap-2 border-t border-line p-3"
      >
        <label htmlFor="menu-chat-input" className="sr-only">
          {t.placeholder}
        </label>
        <textarea
          id="menu-chat-input"
          ref={inputRef}
          rows={1}
          value={draft}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder={t.placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter adds a line. Skip while typing Chinese, Japanese, or Korean.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              ask(draft);
            }
          }}
          className="flex-1 resize-none rounded-md border border-line bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-50"
        >
          {t.send}
        </button>
      </form>
    </section>
  );
}
