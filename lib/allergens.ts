/** The 9 major US allergens. Prompts, filters, and UI all read from this one list. */
export const ALLERGENS = [
  "milk",
  "eggs",
  "fish",
  "shellfish",
  "tree nuts",
  "peanuts",
  "wheat",
  "soy",
  "sesame",
] as const;

/** Tags the AI may suggest from ingredients, for the owner to confirm. */
export const AI_SUGGESTED_TAGS = ["vegan", "vegetarian", "gluten-free"] as const;

/** Tags only owners can set, because they depend on certification or kitchen practice. */
export const OWNER_ONLY_TAGS = ["halal", "kosher", "pregnancy-friendly", "kid-friendly"] as const;

export const DIETARY_TAGS = [...AI_SUGGESTED_TAGS, ...OWNER_ONLY_TAGS] as const;

export type Allergen = (typeof ALLERGENS)[number];
export type DietaryTag = (typeof DIETARY_TAGS)[number];
export type AiSuggestedTag = (typeof AI_SUGGESTED_TAGS)[number];

export function isAllergen(value: string): value is Allergen {
  return (ALLERGENS as readonly string[]).includes(value);
}

export function isDietaryTag(value: string): value is DietaryTag {
  return (DIETARY_TAGS as readonly string[]).includes(value);
}

export function isAiSuggestedTag(value: string): value is AiSuggestedTag {
  return (AI_SUGGESTED_TAGS as readonly string[]).includes(value);
}

/**
 * Allergens that make a diet tag impossible: a vegan dish can't contain eggs, a gluten-free
 * dish can't contain wheat, and so on. A dish with a contradicted tag must never be confirmed
 * or shown to diners filtering by that tag.
 */
export const TAG_CONFLICTS: Partial<Record<DietaryTag, readonly Allergen[]>> = {
  vegan: ["milk", "eggs", "fish", "shellfish"],
  vegetarian: ["fish", "shellfish"],
  "gluten-free": ["wheat"],
  kosher: ["shellfish"],
};

/** The allergens in `allergens` that contradict `tag`, if any. */
export function allergensConflictingWith(
  tag: DietaryTag,
  allergens: readonly Allergen[],
): Allergen[] {
  return (TAG_CONFLICTS[tag] ?? []).filter((allergen) => allergens.includes(allergen));
}

/** Tags in `tags` that the dish's own allergens contradict. */
export function conflictingTags<T extends DietaryTag>(
  allergens: readonly Allergen[],
  tags: readonly T[],
): T[] {
  return tags.filter((tag) => allergensConflictingWith(tag, allergens).length > 0);
}
