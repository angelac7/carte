import { ar } from "@/lib/i18n/owner/ar";
import { de } from "@/lib/i18n/owner/de";
import { en } from "@/lib/i18n/owner/en";
import { es } from "@/lib/i18n/owner/es";
import { fr } from "@/lib/i18n/owner/fr";
import { hi } from "@/lib/i18n/owner/hi";
import { ja } from "@/lib/i18n/owner/ja";
import { ko } from "@/lib/i18n/owner/ko";
import { pt } from "@/lib/i18n/owner/pt";
import { th } from "@/lib/i18n/owner/th";
import { tl } from "@/lib/i18n/owner/tl";
import { vi } from "@/lib/i18n/owner/vi";
import { zh } from "@/lib/i18n/owner/zh";
import type { Plural } from "@/lib/i18n/owner/format";
import type { LanguageCode } from "@/lib/languages";

// TODO: have a native speaker review each language before launch.

/**
 * Every language has English's keys. Counted text can use whichever plural forms the language
 * needs, like Arabic's six or Japanese's one.
 */
type Shape<T> = T extends string
  ? string
  : keyof T extends keyof Plural
    ? Plural
    : { [K in keyof T]: Shape<T[K]> };

/** Every piece of owner dashboard text, in one language. Plain data, so pages can pass it on. */
export type OwnerStrings = Shape<typeof en>;

export const OWNER_STRINGS: Record<LanguageCode, OwnerStrings> = {
  en,
  es,
  zh,
  ko,
  ja,
  fr,
  vi,
  pt,
  de,
  ar,
  hi,
  th,
  tl,
};
