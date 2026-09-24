import { anthropic, MODEL, parseJsonReply } from "@/lib/ai/client";
import type { MenuItem } from "@/types/menu";
import { TranslationReplySchema, type DishTranslation } from "@/types/translation";

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
  const reply = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [{ role: "user", content: buildPrompt(languageName, dishes) }],
  });
  const knownIds = new Set(dishes.map((dish) => dish.id));
  return TranslationReplySchema.parse(parseJsonReply(reply)).dishes.filter((dish) =>
    knownIds.has(dish.id),
  );
}
