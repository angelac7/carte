"use client";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { askMenu, ChatLimitError } from "@/lib/api-client";
import { CHAT_STRINGS } from "@/lib/i18n/chat-strings";
import { HELP_STRINGS } from "@/lib/i18n/help-strings";
import type { LanguageCode } from "@/lib/languages";
import { canSpeak, speak, SPEECH_LANG } from "@/lib/speak";
import { speechInputSupported, useSpeechInput } from "@/lib/use-speech-input";
import { MAX_QUESTION_LENGTH, type ChatMessage } from "@/types/chat";

type MenuChatProps = {
  language: LanguageCode;
  restaurantSlug: string;
  open: boolean;
  onClose: () => void;
};

/** A chat panel, opened from the dock, answered from the confirmed menu only. The conversation stays while it's closed. */
export function MenuChat({ language, restaurantSlug, open, onClose }: MenuChatProps) {
  const t = CHAT_STRINGS[language];
  const help = HELP_STRINGS[language];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const voice = useSpeechInput(SPEECH_LANG[language], (spoken) =>
    setDraft((prev) => (prev ? `${prev} ${spoken}` : spoken).slice(0, MAX_QUESTION_LENGTH)),
  );

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
      const reply = await askMenu(restaurantSlug, language, next);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      setProblem(err instanceof ChatLimitError ? t.limit : t.error);
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <motion.section
      role="dialog"
      aria-label={t.title}
      initial={{ y: 48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      className="fixed inset-x-0 bottom-0 z-30 flex max-h-[80svh] flex-col rounded-t-panel bg-paper shadow-raised-lg sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[26rem] sm:rounded-panel print:hidden"
    >
      <header className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <h2 className="font-serif text-2xl tracking-tight">{t.title}</h2>
        <Button onClick={onClose} variant="ghost" size="sm" className="-mr-2">
          {t.close}
        </Button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5" aria-live="polite">
        <p className="text-sm leading-relaxed text-muted">{t.intro}</p>

        {messages.length === 0 && (
          <div className="flex flex-col items-start gap-2">
            {t.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => ask(suggestion)}
                className="rounded-full bg-paper px-4 py-2.5 text-left text-sm shadow-raised-sm transition-[box-shadow,color] duration-200 hover:text-accent active:shadow-pressed-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={message.role === "user" ? "flex justify-end" : ""}
          >
            <p
              className={`max-w-[85%] rounded-[1.25rem] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                message.role === "user"
                  ? "rounded-br-md bg-accent text-white"
                  : "rounded-bl-md shadow-pressed-sm"
              }`}
            >
              {message.content}
            </p>
            {message.role === "assistant" && canSpeak() && (
              <button
                onClick={() => speak(message.content, SPEECH_LANG[language])}
                className="mt-1 text-xs text-muted underline hover:text-ink"
              >
                {help.listen}
              </button>
            )}
          </motion.div>
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
        className="flex gap-2 border-t border-ink/10 p-4"
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
          placeholder={voice.listening ? help.listening : t.placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter adds a line. Skip while typing Chinese, Japanese, or Korean.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              ask(draft);
            }
          }}
          className={fieldClass("flex-1 resize-none")}
        />
        {speechInputSupported() && (
          <button
            type="button"
            aria-label={help.voice}
            aria-pressed={voice.listening}
            onClick={voice.listening ? voice.stop : voice.start}
            className={`rounded-control px-4 py-3 text-sm transition-[box-shadow,color] duration-200 ${
              voice.listening
                ? "text-tomato shadow-pressed-sm"
                : "bg-paper shadow-raised-sm active:shadow-pressed-sm"
            }`}
          >
            {voice.listening ? "■" : "🎤"}
          </button>
        )}
        <Button type="submit" disabled={sending || !draft.trim()}>
          {t.send}
        </Button>
      </form>
    </motion.section>
  );
}
