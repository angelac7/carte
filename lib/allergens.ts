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

export const DIETARY_TAGS = ["vegan", "vegetarian", "gluten-free"] as const;

export type Allergen = (typeof ALLERGENS)[number];
export type DietaryTag = (typeof DIETARY_TAGS)[number];

export function isAllergen(value: string): value is Allergen {
  return (ALLERGENS as readonly string[]).includes(value);
}

export function isDietaryTag(value: string): value is DietaryTag {
  return (DIETARY_TAGS as readonly string[]).includes(value);
}
