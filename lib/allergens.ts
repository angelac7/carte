/** The 9 major US allergens, which Carte has covered from the start. */
export const US_ALLERGENS = [
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

/** The rest of the EU's 14. Dishes confirmed before these were added weren't checked for them. */
export const NEWER_ALLERGENS = ["celery", "mustard", "lupin", "mollusks", "sulfites"] as const;

/**
 * The 14 major allergens. Prompts, filters, and UI all read from this one list; the database
 * checks in supabase/migrations must match it.
 */
export const ALLERGENS = [...US_ALLERGENS, ...NEWER_ALLERGENS] as const;

/** Which list an owner checks when confirming now: 1 was the original 9, 2 is all 14. */
export const ALLERGEN_LIST_VERSION = 2;

/** How many allergens a dish was checked for, from the list it was confirmed against. */
export function allergensChecked(allergenList: number | undefined): number {
  return (allergenList ?? 1) >= 2 ? ALLERGENS.length : US_ALLERGENS.length;
}

/**
 * The avoided allergens a dish was never checked for. It can't be vouched for to that diner,
 * so it's hidden from them, with a note to ask staff.
 */
export function uncheckedAllergens(
  allergenList: number | undefined,
  avoid: readonly Allergen[],
): Allergen[] {
  if ((allergenList ?? 1) >= 2) return [];
  return avoid.filter((allergen) => (NEWER_ALLERGENS as readonly string[]).includes(allergen));
}

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
