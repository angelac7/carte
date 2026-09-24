import { z } from "zod";

const text = z
  .string()
  .nullish()
  .transform((value) => value ?? "");

// 0 = none, 3 = very. Out-of-range or garbled values are clamped rather than rejected.
const level = z.coerce
  .number()
  .catch(0)
  .transform((n) => Math.max(0, Math.min(3, Math.round(n))));

const shortList = (max: number) =>
  z
    .array(z.string())
    .nullish()
    .transform((list) => (list ?? []).filter(Boolean).slice(0, max));

export const DishInsightSchema = z.object({
  summary: text,
  taste: text,
  background: text,
  nativeName: text,
  nativeLang: text,
  phonetic: text,
  spice: level,
  richness: level,
  portion: z.enum(["small", "single", "share"]).catch("single"),
  portionNote: text,
  glossary: z
    .array(z.object({ term: text, meaning: text }))
    .nullish()
    .transform((list) => (list ?? []).filter((g) => g.term && g.meaning).slice(0, 6)),
  pairings: shortList(4),
  askKitchen: shortList(3),
});

export type DishInsight = z.infer<typeof DishInsightSchema>;
