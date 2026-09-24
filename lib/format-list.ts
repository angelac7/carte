import { htmlLang, type LanguageCode } from "@/lib/languages";

/** Joins items the way each language does, e.g. "milk, eggs, and fish" or "牛奶、鸡蛋和鱼". */
export function formatList(items: string[], language: LanguageCode): string {
  return new Intl.ListFormat(htmlLang(language), { style: "long", type: "conjunction" }).format(
    items,
  );
}
