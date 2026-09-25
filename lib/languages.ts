export const LANGUAGES = [
  { code: "en", label: "English", htmlLang: "en", aiName: "English" },
  { code: "es", label: "Español", htmlLang: "es", aiName: "Spanish" },
  { code: "zh", label: "中文（简体）", htmlLang: "zh-Hans", aiName: "Simplified Chinese" },
  { code: "ko", label: "한국어", htmlLang: "ko", aiName: "Korean" },
  { code: "ja", label: "日本語", htmlLang: "ja", aiName: "Japanese" },
  { code: "fr", label: "Français", htmlLang: "fr", aiName: "French" },
  { code: "vi", label: "Tiếng Việt", htmlLang: "vi", aiName: "Vietnamese" },
  { code: "pt", label: "Português", htmlLang: "pt-BR", aiName: "Brazilian Portuguese" },
  { code: "de", label: "Deutsch", htmlLang: "de", aiName: "German" },
  { code: "ar", label: "العربية", htmlLang: "ar", aiName: "Modern Standard Arabic" },
  { code: "hi", label: "हिन्दी", htmlLang: "hi", aiName: "Hindi" },
  { code: "th", label: "ไทย", htmlLang: "th", aiName: "Thai" },
  { code: "tl", label: "Tagalog", htmlLang: "tl", aiName: "Tagalog (Filipino)" },
] as const;

/** Languages written right to left, so pages flip their layout for them. */
const RIGHT_TO_LEFT: readonly string[] = ["ar"];

/** "rtl" for Arabic, "ltr" for everything else, for a page's dir attribute. */
export function textDirection(code: LanguageCode): "rtl" | "ltr" {
  return RIGHT_TO_LEFT.includes(code) ? "rtl" : "ltr";
}

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

/** Fallback UI/staff language when no preference is available. Dish source languages are independent. */
export const ORIGINAL_LANGUAGE: LanguageCode = "en";
export const LANGUAGE_COOKIE = "carte-language";

export function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGES.some((language) => language.code === value);
}

function findLanguage(code: LanguageCode) {
  return LANGUAGES.find((language) => language.code === code)!;
}

export const languageName = (code: LanguageCode) => findLanguage(code).aiName;
export const htmlLang = (code: LanguageCode) => findLanguage(code).htmlLang;

/** Picks the first supported language from a list like ["ko-KR", "en-US"]. */
export function matchBrowserLanguage(tags: readonly string[]): LanguageCode {
  for (const tag of tags) {
    const base = tag.toLowerCase().split("-")[0];
    // Phones set to Filipino report "fil"; Carte's Tagalog covers it.
    const code = base === "fil" ? "tl" : base;
    if (isLanguageCode(code)) return code;
  }
  return ORIGINAL_LANGUAGE;
}

/** Reads a browser's Accept-Language header, such as "ko-KR,ko;q=0.9,en;q=0.8". */
export function languageFromAcceptHeader(header: string): LanguageCode {
  const tags = header
    .split(",")
    .map((part) => part.split(";")[0].trim())
    .filter(Boolean);
  return matchBrowserLanguage(tags);
}
