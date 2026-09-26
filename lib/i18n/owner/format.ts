import type { LanguageCode } from "@/lib/languages";

/**
 * Owner dashboard text is plain data, so a page can hand one language's text to the browser.
 * Placeholders look like {name}; counts use each language's plural rules.
 */
export type Plural = {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

/** Fills in placeholders like {name}. Unknown placeholders are left as they are. */
export function fmt(template: string, values: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}

/** The right form for a count, like "1 dish" or "5 dishes", with {count} filled in. */
export function plural(
  forms: Plural,
  count: number,
  language: LanguageCode,
  values: Record<string, string | number> = {},
): string {
  const category = new Intl.PluralRules(language).select(count) as keyof Plural;
  return fmt(forms[category] ?? forms.other, { count, ...values });
}
