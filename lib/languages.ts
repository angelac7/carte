export const LANGUAGES = [
  { code: "en", label: "English", htmlLang: "en", aiName: "English" },
  { code: "es", label: "Español", htmlLang: "es", aiName: "Spanish" },
  { code: "zh", label: "中文（简体）", htmlLang: "zh-Hans", aiName: "Simplified Chinese" },
  { code: "ko", label: "한국어", htmlLang: "ko", aiName: "Korean" },
  { code: "ja", label: "日本語", htmlLang: "ja", aiName: "Japanese" },
  { code: "fr", label: "Français", htmlLang: "fr", aiName: "French" },
  { code: "vi", label: "Tiếng Việt", htmlLang: "vi", aiName: "Vietnamese" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

/** Menus are uploaded in this language, so it never needs AI translation. */
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
    if (isLanguageCode(base)) return base;
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
