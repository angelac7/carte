import { z } from "zod";

const text = z
  .string()
  .nullish()
  .transform((value) => value ?? "");

export const DishTranslationSchema = z.object({
  id: z.string(),
  name: text,
  description: text,
  notes: text,
  section: text,
  /** Size names then add-on names, in the dish's own order. */
  options: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
});

export const TranslationReplySchema = z.object({ dishes: z.array(DishTranslationSchema) });

export type DishTranslation = z.infer<typeof DishTranslationSchema>;
export type TranslatedText = Omit<DishTranslation, "id">;

/** Translated dish text, keyed by dish id. */
export type MenuTranslations = Record<string, TranslatedText>;
