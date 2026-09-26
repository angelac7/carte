import { allergensConflictingWith, type Allergen, type DietaryTag } from "@/lib/allergens";
import { formatList } from "@/lib/format-list";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import type { LanguageCode } from "@/lib/languages";

/**
 * Owner-facing explanations for diet tags that a dish's allergens contradict, such as
 * "Remove “vegan”: this dish contains fish and eggs." Empty when the tags are consistent.
 */
export function tagConflictMessages(
  allergens: readonly Allergen[],
  tags: readonly DietaryTag[],
  language: LanguageCode = "en",
  template = "Remove “{tag}”: this dish contains {allergens}.",
): string[] {
  const d = DINER_STRINGS[language];
  return tags.flatMap((tag) => {
    const conflicts = allergensConflictingWith(tag, allergens);
    return conflicts.length > 0
      ? [
          template.replace("{tag}", d.tags[tag]).replace(
            "{allergens}",
            formatList(
              conflicts.map((allergen) => d.allergens[allergen]),
              language,
            ),
          ),
        ]
      : [];
  });
}
