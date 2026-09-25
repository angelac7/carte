import { allergensConflictingWith, type Allergen, type DietaryTag } from "@/lib/allergens";
import { formatList } from "@/lib/format-list";

/**
 * Owner-facing explanations for diet tags that a dish's allergens contradict, such as
 * "Remove “vegan”: this dish contains fish and eggs." Empty when the tags are consistent.
 */
export function tagConflictMessages(
  allergens: readonly Allergen[],
  tags: readonly DietaryTag[],
): string[] {
  return tags.flatMap((tag) => {
    const conflicts = allergensConflictingWith(tag, allergens);
    return conflicts.length > 0
      ? [`Remove “${tag}”: this dish contains ${formatList(conflicts, "en")}.`]
      : [];
  });
}
