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

/**
 * Other things diners often avoid for religion, health, or taste. They aren't allergens, but
 * owners mark them the same way, and diners can hide them. Only owners set them, never AI.
 */
export const OTHER_AVOIDS = ["pork", "beef", "alcohol", "onion", "garlic", "cilantro"] as const;
export type OtherAvoid = (typeof OTHER_AVOIDS)[number];

export function isOtherAvoid(value: string): value is OtherAvoid {
  return (OTHER_AVOIDS as readonly string[]).includes(value);
}

/**
 * Facts about the whole kitchen an owner can state. Each has a fixed translation, because
 * allergy information is never written by AI.
 */
export const KITCHEN_PRACTICES = [
  "shared-fryer",
  "shared-grill",
  "shared-surfaces",
  "nuts-in-kitchen",
  "peanut-oil",
  "sesame-in-kitchen",
  "flour-in-kitchen",
  "shellfish-in-kitchen",
] as const;
export type KitchenPractice = (typeof KITCHEN_PRACTICES)[number];

export function isKitchenPractice(value: string): value is KitchenPractice {
  return (KITCHEN_PRACTICES as readonly string[]).includes(value);
}

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

/** The allergens each kitchen practice matters most for. Shared equipment matters for all. */
const PRACTICE_ALLERGENS: Record<KitchenPractice, readonly Allergen[]> = {
  "shared-fryer": [],
  "shared-grill": [],
  "shared-surfaces": [],
  "nuts-in-kitchen": ["peanuts", "tree nuts"],
  "peanut-oil": ["peanuts"],
  "sesame-in-kitchen": ["sesame"],
  "flour-in-kitchen": ["wheat"],
  "shellfish-in-kitchen": ["shellfish", "mollusks"],
};

/**
 * A kitchen's practices in the order a diner should read them: the ones about allergens they
 * avoid first, marked so the menu can point them out. None are ever left out.
 */
export function practicesFor(
  practices: readonly KitchenPractice[],
  avoid: readonly string[],
): { practice: KitchenPractice; yours: boolean }[] {
  const marked = KITCHEN_PRACTICES.filter((practice) => practices.includes(practice)).map(
    (practice) => ({
      practice,
      yours: PRACTICE_ALLERGENS[practice].some((allergen) => avoid.includes(allergen)),
    }),
  );
  return [...marked.filter((p) => p.yours), ...marked.filter((p) => !p.yours)];
}
