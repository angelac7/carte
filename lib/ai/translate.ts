import { createMessage, parseJsonReply } from "@/lib/ai/client";
import { jsonReply, list, object, string } from "@/lib/ai/json-schema";
import type { MenuItem } from "@/types/menu";
import { TranslationReplySchema, type DishTranslation } from "@/types/translation";

const TRANSLATION_SCHEMA = object({
  dishes: list(object({ id: string, name: string, description: string, notes: string })),
});

function buildPrompt(languageName: string, dishes: MenuItem[]): string {
  const source = dishes.map(({ id, name, description, notes }) => ({
    id,
    name,
    description,
    notes,
  }));
  return `Translate this restaurant menu text into ${languageName} for diners.
Rules:
- Translate each dish's name, description, and kitchen notes naturally.
- If a dish is widely known by its original name (like ramen, tiramisu, or pho), keep that name in ${languageName}'s usual script, optionally with a short translation in parentheses.
- Keep ingredient meaning exact. Never add, remove, or soften ingredients or warnings.
- Keep the same id for each dish. Leave empty fields empty.
Return ONLY valid JSON, no other text, in this format:
{"dishes":[{"id":"","name":"","description":"","notes":""}]}
Dishes:
${JSON.stringify(source)}`;
}

/** Translates dish text with AI. Allergen labels are never sent; they use fixed translations. */
export async function translateDishes(
  dishes: MenuItem[],
  languageName: string,
): Promise<DishTranslation[]> {
  if (dishes.length === 0) return [];
  // Saved per restaurant and language, so the careful setting is paid for once.
  const reply = await createMessage({
    max_tokens: 32000,
    output_config: jsonReply(TRANSLATION_SCHEMA, "high"),
    messages: [{ role: "user", content: buildPrompt(languageName, dishes) }],
  });
  const knownIds = new Set(dishes.map((dish) => dish.id));
  return TranslationReplySchema.parse(parseJsonReply(reply)).dishes.filter((dish) =>
    knownIds.has(dish.id),
  );
}
