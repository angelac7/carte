import { en } from "@/lib/i18n/owner/en";
import type { LanguageCode } from "@/lib/languages";

// TODO: have a native speaker review each language before launch.

/** Every piece of owner dashboard text, in one language. Plain data, so pages can pass it on. */
export type OwnerStrings = typeof en;

export const OWNER_STRINGS: Record<LanguageCode, OwnerStrings> = {
  en,
  es: en,
  zh: en,
  ko: en,
  ja: en,
  fr: en,
  vi: en,
  pt: en,
  de: en,
  ar: en,
  hi: en,
  th: en,
  tl: en,
};
