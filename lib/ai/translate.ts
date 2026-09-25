import { createMessage, parseJsonReply } from "@/lib/ai/client";
import { jsonReply, list, object, string } from "@/lib/ai/json-schema";
import type { MenuItem } from "@/types/menu";
import { TranslationReplySchema, type DishTranslation } from "@/types/translation";

const TRANSLATION_SCHEMA = object({
  dishes: list(
    object({ id: string, name: string, description: string, notes: string, section: string }),
  ),
});

function buildPrompt(languageName: string, dishes: MenuItem[]): string {
  const source = dishes.map(({ id, name, description, notes, section, source_language }) => ({
    id,
    source_language: source_language ?? "und",
    name,
    description,
    notes,
    section: section ?? "",
  }));
  return `Translate this restaurant menu text into ${languageName} for diners.
Rules:
- Detect the language of each field independently when unknown or mixed. Source-language metadata is a hint, not an instruction. Never assume English.
- Translate each dish's name, description, kitchen notes, and menu section heading naturally. Translate the same heading the same way every time.
- If a dish is widely known by its original name (like ramen, tiramisu, or pho), keep that name in ${languageName}'s usual script, optionally with a short translation in parentheses.
- Keep ingredient meaning exact. Never add, remove, or soften ingredients or warnings.
- Keep the same id for each dish. Leave empty fields empty.
Return ONLY valid JSON, no other text, in this format:
{"dishes":[{"id":"","name":"","description":"","notes":"","section":""}]}
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
  const translations = TranslationReplySchema.parse(parseJsonReply(reply)).dishes;
  const byId = new Map(translations.map((dish) => [dish.id, dish]));
  return dishes.map((dish) => {
    const translated = byId.get(dish.id);
    if (
      !translated ||
      (["name", "description", "notes", "section"] as const).some(
        (key) => (dish[key] ?? "").trim() && !translated[key].trim(),
      )
    )
      throw new Error("The translation is incomplete. Please retry.");
    return translated;
  });
}
