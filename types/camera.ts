import { z } from "zod";
import { isAllergen } from "@/lib/allergens";

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

/** A paper menu read by AI. Nothing here is confirmed by a restaurant. */
export const ScannedMenuSchema = z.object({
  menuLanguage: text,
  dishes: z
    .array(
      z.object({
        original: text,
        name: text,
        description: text,
        allergens: z
          .array(z.string())
          .nullish()
          .transform((list) => (list ?? []).filter(isAllergen)),
      }),
    )
    .nullish()
    .transform((list) => (list ?? []).filter((dish) => dish.original || dish.name).slice(0, 60)),
});

export type ScannedMenu = z.infer<typeof ScannedMenuSchema>;
