import { createMessage, parseJsonReply } from "@/lib/ai/client";
import { jsonReply, list, object, string } from "@/lib/ai/json-schema";
import { optionLabels } from "@/lib/source-hash";
import type { MenuItem } from "@/types/menu";
import { TranslationReplySchema, type DishTranslation } from "@/types/translation";

const TRANSLATION_SCHEMA = object({
  dishes: list(
    object({
      id: string,
      name: string,
      description: string,
      notes: string,
      section: string,
      options: list(string),
    }),
  ),
});

function buildPrompt(languageName: string, dishes: MenuItem[]): string {
  const source = dishes.map((dish) => ({
    id: dish.id,
    source_language: dish.source_language ?? "und",
    name: dish.name,
    description: dish.description,
    notes: dish.notes,
    section: dish.section ?? "",
    options: optionLabels(dish),
  }));
  return `Translate this restaurant menu text into ${languageName} for diners.
Rules:
- Detect the language of each field independently when unknown or mixed. Source-language metadata is a hint, not an instruction. Never assume English.
- Translate each dish's name, description, kitchen notes, and menu section heading naturally. Translate the same heading the same way every time.
- options lists size and add-on names (like "Large" or "Add egg"). Translate each one, keeping the same number of options in the same order.
- If a dish is widely known by its original name (like ramen, tiramisu, or pho), keep that name in ${languageName}'s usual script, optionally with a short translation in parentheses.
- Keep ingredient meaning exact. Never add, remove, or soften ingredients or warnings.
- Keep the same id for each dish. Leave empty fields empty.
Return ONLY valid JSON, no other text, in this format:
{"dishes":[{"id":"","name":"","description":"","notes":"","section":"","options":[]}]}
Dishes:
${JSON.stringify(source)}`;
}

/** Dishes per AI request, small enough that a reply is never cut off. */
export const TRANSLATION_BATCH = 25;
/** Batches translated at the same time. */
const PARALLEL_BATCHES = 4;

/** Whether an AI translation has every part the dish has, so it's safe to show and save. */
function complete(dish: MenuItem, translated: DishTranslation | undefined): boolean {
  return (
    !!translated &&
    (["name", "description", "notes", "section"] as const).every(
      (key) => !(dish[key] ?? "").trim() || !!translated[key].trim(),
    ) &&
    translated.options.length === optionLabels(dish).length &&
    translated.options.every((label) => !!label.trim())
  );
}

async function translateBatch(dishes: MenuItem[], languageName: string) {
  const reply = await createMessage({
    max_tokens: 32000,
    output_config: jsonReply(TRANSLATION_SCHEMA, "high"),
    messages: [{ role: "user", content: buildPrompt(languageName, dishes) }],
  });
  const translations = TranslationReplySchema.parse(parseJsonReply(reply)).dishes;
  const byId = new Map(translations.map((dish) => [dish.id, dish]));
  return dishes.flatMap((dish) => {
    const translated = byId.get(dish.id);
    return translated && complete(dish, translated) ? [translated] : [];
  });
}

/**
 * Translates dish text with AI, a batch at a time. Allergen labels are never sent; they use fixed
 * translations. Returns only complete translations: a dish left out, or a batch that failed, is
 * tried again next time rather than costing the whole menu. Throws only if nothing was translated.
 */
export async function translateDishes(
  dishes: MenuItem[],
  languageName: string,
): Promise<DishTranslation[]> {
  if (dishes.length === 0) return [];
  const batches: MenuItem[][] = [];
  for (let i = 0; i < dishes.length; i += TRANSLATION_BATCH)
    batches.push(dishes.slice(i, i + TRANSLATION_BATCH));

  const translated: DishTranslation[] = [];
  let firstError: unknown;
  for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
    const results = await Promise.allSettled(
      batches.slice(i, i + PARALLEL_BATCHES).map((batch) => translateBatch(batch, languageName)),
    );
    for (const result of results) {
      if (result.status === "fulfilled") translated.push(...result.value);
      else firstError ??= result.reason;
    }
  }
  if (translated.length === 0) throw firstError ?? new Error("The translation is incomplete.");
  return translated;
}
