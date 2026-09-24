import { z } from "zod";
import { ALLERGENS, DIETARY_TAGS } from "@/lib/allergens";
import { isLanguageCode, type LanguageCode } from "@/lib/languages";
import { isValidSlug } from "@/lib/slug";

export const HUNGER_LEVELS = ["light", "hungry", "very"] as const;
export type Hunger = (typeof HUNGER_LEVELS)[number];

export const RecommendRequestSchema = z.object({
  restaurant: z.string().refine(isValidSlug),
  language: z.custom<LanguageCode>((value) => typeof value === "string" && isLanguageCode(value)),
  avoid: z.array(z.enum(ALLERGENS)).max(ALLERGENS.length),
  onlyTags: z.array(z.enum(DIETARY_TAGS)).max(DIETARY_TAGS.length),
  hunger: z.enum(HUNGER_LEVELS),
  spice: z.number().int().min(0).max(3),
  people: z.number().int().min(1).max(12),
  budget: z.number().positive().max(10000).nullable(),
});

export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;

const text = z
  .string()
  .nullish()
  .transform((value) => value ?? "");

export const RecommendationSchema = z.object({
  picks: z
    .array(z.object({ id: z.string(), reason: text }))
    .nullish()
    .transform((list) => (list ?? []).slice(0, 5)),
  note: text,
});

export type Recommendation = z.infer<typeof RecommendationSchema>;
