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
