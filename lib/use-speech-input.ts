"use client";
import { useEffect, useRef, useState } from "react";

// Speech recognition isn't in TypeScript's built-in types yet, so we describe the parts we use.
type RecognitionEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;

function getRecognition(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function speechInputSupported(): boolean {
  return getRecognition() !== undefined;
}

/** Listens once and hands back what the diner said. */
export function useSpeechInput(lang: string, onText: (text: string) => void, enabled = true) {
  const [listening, setListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);

  useEffect(() => {
    if (!enabled) {
      const instance = recognition.current;
      if (instance) {
        instance.onresult = null;
        instance.abort();
      }
    }
    return () => {
      const instance = recognition.current;
      if (instance) {
        instance.onresult = null;
        instance.onend = null;
        instance.onerror = null;
        instance.abort();
        recognition.current = null;
        setListening(false);
      }
    };
  }, [enabled, lang]);

  function start() {
    const SpeechRecognition = getRecognition();
    if (!SpeechRecognition || !enabled || recognition.current) return;
    const instance = new SpeechRecognition();
    instance.lang = lang;
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    instance.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (text) onText(text);
    };
    const finish = () => {
      if (recognition.current !== instance) return;
      recognition.current = null;
      setListening(false);
    };
    instance.onend = finish;
    instance.onerror = finish;
    recognition.current = instance;
    setListening(true);
    try {
      instance.start();
    } catch {
      finish();
    }
  }

  function stop() {
    recognition.current?.stop();
  }

  return { listening: enabled && listening, start, stop };
}
