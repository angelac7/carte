import { z } from "zod";
import { ALLERGENS, DIETARY_TAGS, isAiSuggestedTag, isAllergen } from "@/lib/allergens";

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

/** A dish as the AI read it from a menu photo. Allergens are suggestions, not confirmed. */
export const ExtractedDishSchema = z.object({
  source_language: SourceLanguageSchema.optional(),
  name: text,
  description: text,
  price: text,
  likely_allergens: allergenList,
  dietary_tags: tagList,
});

export const ExtractedMenuSchema = z.object({
  items: z
    .array(ExtractedDishSchema)
    .transform((dishes) => dishes.filter((dish) => dish.name.trim() !== "")),
});

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
  // Set only by the photo upload route, never by dish edits.
  photo_url: z.string().nullable().optional(),
});

export type ExtractedDish = z.infer<typeof ExtractedDishSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;

/** A dish's text as shown to a diner, translated when available. */
export type DishText = { name: string; description: string; notes: string };
