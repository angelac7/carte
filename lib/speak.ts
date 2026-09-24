import type { LanguageCode } from "@/lib/languages";

/** Voice codes for the phone's speech features, which expect a region. */
export const SPEECH_LANG: Record<LanguageCode, string> = {
  en: "en-US",
  es: "es-US",
  zh: "zh-CN",
  ko: "ko-KR",
  ja: "ja-JP",
  fr: "fr-FR",
  vi: "vi-VN",
};

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Reads text aloud with the phone's built-in voice, slightly slowed down. */
export function speak(text: string, lang: string, rate = 0.9): void {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang || "en-US";
  utterance.rate = rate;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
