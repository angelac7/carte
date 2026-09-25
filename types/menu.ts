import { z } from "zod";
import {
  ALLERGENS,
  conflictingTags,
  DIETARY_TAGS,
  isAiSuggestedTag,
  isAllergen,
} from "@/lib/allergens";

export const SourceLanguageSchema = z
  .string()
  .max(35)
  .regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/);

// AI output can have numbers, nulls, or unknown allergens, so these helpers clean it up.
const text = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((value) => (value == null ? "" : String(value)));

const allergenList = z
  .array(z.string())
  .nullish()
  .transform((list) => (list ?? []).filter(isAllergen));

const tagList = z
  .array(z.string())
  .nullish()
  .transform((list) => (list ?? []).filter(isAiSuggestedTag));

/** A spice level from AI output, clamped to 0–3; anything unreadable becomes "not set". */
const spiceGuess = z.union([z.number(), z.string(), z.null()]).transform((value) => {
  const n = Number(value);
  return value === null || value === "" || !Number.isFinite(n)
    ? null
    : Math.max(0, Math.min(3, Math.round(n)));
});

/**
 * A dish as the AI read it from a menu photo. Allergens are suggestions, not confirmed.
 * Suggested diet tags that its own allergens contradict (like vegan with eggs) are dropped.
 */
export const ExtractedDishSchema = z
  .object({
    source_language: SourceLanguageSchema.optional(),
    name: text,
    description: text,
    price: text,
    /** The menu heading the dish is listed under, like "Starters". */
    section: text.transform((value) => value.trim().slice(0, 80)).optional(),
    /** 0 not spicy to 3 hot, guessed from the menu; the owner can change it. */
    spice: spiceGuess.optional(),
    likely_allergens: allergenList,
    dietary_tags: tagList,
  })
  .transform((dish) => {
    const contradicted = conflictingTags(dish.likely_allergens, dish.dietary_tags);
    return {
      ...dish,
      dietary_tags: dish.dietary_tags.filter((tag) => !contradicted.includes(tag)),
    };
  });

export const ExtractedMenuSchema = z.object({
  items: z
    .array(ExtractedDishSchema)
    .transform((dishes) => dishes.filter((dish) => dish.name.trim() !== "")),
});

/** A daily serving time like "11:30", or "11:30:00" as the database returns it. */
export const ServingTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);

const OptionLabelSchema = z.string().trim().min(1).max(60);
const OptionPriceSchema = z.string().trim().max(20);

/** A size a dish comes in, like "Large", with its own price. */
export const DishSizeSchema = z.object({ label: OptionLabelSchema, price: OptionPriceSchema });

/** Something a diner can add, like "Add egg". Its allergens come from the owner, like the dish's. */
export const DishAddonSchema = z.object({
  label: OptionLabelSchema,
  price: OptionPriceSchema,
  allergens: z.array(z.enum(ALLERGENS)).max(ALLERGENS.length),
});

export type DishSize = z.infer<typeof DishSizeSchema>;
export type DishAddon = z.infer<typeof DishAddonSchema>;

/** A saved dish. Only confirmed dishes will be shown to diners. */
export const MenuItemSchema = z.object({
  source_language: SourceLanguageSchema.optional(),
  id: z.string().min(1),
  revision: z.number().int().positive().optional(),
  name: z.string(),
  description: z.string(),
  price: z.string(),
  allergens: z.array(z.enum(ALLERGENS)),
  dietary_tags: z.array(z.enum(DIETARY_TAGS)),
  notes: z.string().max(2000),
  confirmed: z.boolean(),
  /** The menu heading the dish is listed under, like "Starters". Empty when there's none. */
  section: z.string().trim().max(80).optional(),
  /** The owner's order for the menu, lowest first. Changed only by reordering. */
  sort_order: z.number().int().optional(),
  /** The service day it sold out, like "2026-09-25". Set only by the sold-out switch. */
  sold_out_on: z.string().nullable().optional(),
  /** Shown with the specials at the top of the menu. */
  special: z.boolean().optional(),
  /** 0 not spicy to 3 hot, or null when not set. */
  spice: z.number().int().min(0).max(3).nullable().optional(),
  /** Allergens in the dish the kitchen can leave out on request. */
  removable: z.array(z.enum(ALLERGENS)).max(ALLERGENS.length).optional(),
  /** Allergens not in the recipe that may get in, like through a shared fryer. */
  may_contain: z.array(z.enum(ALLERGENS)).max(ALLERGENS.length).optional(),
  /** Which allergen list the owner checked when confirming: 1 was the original 9, 2 is all 14. */
  allergen_list: z.number().int().min(1).max(2).optional(),
  sizes: z.array(DishSizeSchema).max(8).optional(),
  addons: z.array(DishAddonSchema).max(12).optional(),
  /** An optional daily serving window in the restaurant's time zone. */
  available_from: ServingTimeSchema.nullable().optional(),
  available_until: ServingTimeSchema.nullable().optional(),
  // Set only by the photo upload route, never by dish edits.
  photo_url: z.string().nullable().optional(),
});

export type ExtractedDish = z.infer<typeof ExtractedDishSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;

/** A dish's text as shown to a diner, translated when available. */
export type DishText = {
  name: string;
  description: string;
  notes: string;
  section?: string;
  /** Size names then add-on names, translated, in the dish's own order. */
  options?: string[];
};
