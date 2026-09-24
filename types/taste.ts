import { z } from "zod";
import { isLanguageCode, type LanguageCode } from "@/lib/languages";

export const TasteRequestSchema = z.object({
  language: z.custom<LanguageCode>((value) => typeof value === "string" && isLanguageCode(value)),
  dishes: z
    .array(
      z.object({
        name: z.string().max(120),
        rating: z.number().int().min(1).max(5),
        note: z.string().max(200),
        cuisine: z.string().max(60),
        restaurant: z.string().max(120),
      }),
    )
    .min(3)
    .max(40),
  saved: z.array(z.string().max(120)).max(40),
});

export type TasteRequest = z.infer<typeof TasteRequestSchema>;

const text = z
  .string()
  .nullish()
  .transform((value) => value ?? "");

const shortList = (max: number) =>
  z
    .array(z.string())
    .nullish()
    .transform((list) => (list ?? []).filter(Boolean).slice(0, max));

export const TasteProfileSchema = z.object({
  summary: text,
  loves: shortList(5),
  tryNext: shortList(3),
});

export type TasteProfile = z.infer<typeof TasteProfileSchema>;
