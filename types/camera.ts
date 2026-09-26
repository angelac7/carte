import { z } from "zod";
import { ALLERGENS, DIETARY_TAGS, isAllergen, OTHER_AVOIDS } from "@/lib/allergens";

import { isLanguageCode, type LanguageCode } from "@/lib/languages";
import { isValidSlug } from "@/lib/slug";

export const PhotoMatchRequestSchema = z.object({
  restaurant: z.string().refine(isValidSlug),
  language: z.custom<LanguageCode>((value) => typeof value === "string" && isLanguageCode(value)),
  avoid: z.array(z.enum(ALLERGENS)).max(ALLERGENS.length),
  onlyTags: z.array(z.enum(DIETARY_TAGS)).max(DIETARY_TAGS.length),
  alsoAvoid: z.array(z.enum(OTHER_AVOIDS)).max(OTHER_AVOIDS.length).default([]),
});

const text = z
  .string()
  .nullish()
  .transform((value) => value ?? "");

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;

export const PhotoMatchSchema = z.object({
  matches: z
    .array(
      z.object({
        id: z.string(),
        confidence: z.enum(CONFIDENCE_LEVELS).catch("low"),
        reason: text,
      }),
    )
    .nullish()
    .transform((list) => (list ?? []).slice(0, 3)),
});

export type PhotoMatch = z.infer<typeof PhotoMatchSchema>["matches"][number];

/** The most dishes read from one scanned menu. */
export const MAX_SCANNED_DISHES = 60;

/** One dish from a scanned paper menu. Its allergens are AI guesses, never confirmed. */
export const ScannedDishSchema = z.object({
  original: text,
  name: text,
  description: text,
  allergens: z
    .array(z.string())
    .nullish()
    .transform((list) => (list ?? []).filter(isAllergen)),
});

/** The first line of a streamed scan: the menu's main language as a BCP 47 code. */
// Required, so dish lines (which have no menuLanguage) never match.
export const MenuLanguageLineSchema = z.object({
  menuLanguage: z.string().transform((code) => code.slice(0, 20)),
});

/** A paper menu read by AI. Nothing here is confirmed by a restaurant. */
export const ScannedMenuSchema = z.object({
  menuLanguage: text,
  dishes: z
    .array(ScannedDishSchema)
    .nullish()
    .transform((list) =>
      (list ?? []).filter((dish) => dish.original || dish.name).slice(0, MAX_SCANNED_DISHES),
    ),
});

export type ScannedDish = z.infer<typeof ScannedDishSchema>;
export type ScannedMenu = z.infer<typeof ScannedMenuSchema>;
