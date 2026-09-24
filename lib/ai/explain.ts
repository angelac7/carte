import { anthropic, MODEL, parseJsonReply } from "@/lib/ai/client";
import { DishInsightSchema, type DishInsight } from "@/types/insight";
import type { MenuItem } from "@/types/menu";

function buildPrompt(dish: MenuItem, languageName: string, restaurantName: string): string {
  const source = { name: dish.name, description: dish.description, kitchen_notes: dish.notes };
  return `You explain restaurant dishes to diners in ${languageName}.
This dish is from the menu at ${restaurantName}:
${JSON.stringify(source)}

Write for someone who has never had this dish. Rules:
- Base everything on the menu description and kitchen notes. You may add widely known general facts about this kind of dish, phrased as typical ("usually", "traditionally").
- Never state or guess allergens, and never call the dish safe for any diet. The restaurant shows confirmed allergens separately.
- askKitchen: only questions or requests supported by the kitchen notes or description, such as "Ask if the sauce can come on the side." If nothing fits, return [].
- nativeName: the dish name in its original language's script if it comes from a non-English cuisine (for example 쌈밥 for ssam bap); otherwise the name as written. nativeLang: its BCP 47 code, such as "ko-KR" or "en-US". phonetic: a simple English-style pronunciation guide, such as "SAHM-bahp".
- spice and richness: 0 (none) to 3 (very), estimated from the listed ingredients.
- portion: "small" for small plates, "share" if usually shared, otherwise "single".
- Write summary, taste, background, portionNote, glossary, pairings, and askKitchen in ${languageName}. Keep each text field to one or two short sentences.

Return ONLY valid JSON, no other text, in this format:
{"summary":"","taste":"","background":"","nativeName":"","nativeLang":"","phonetic":"","spice":0,"richness":0,"portion":"single","portionNote":"","glossary":[{"term":"","meaning":""}],"pairings":[],"askKitchen":[]}`;
}

/** Explains a dish for diners. Allergens are never included; they come from the restaurant. */
export async function explainDish(
  dish: MenuItem,
  languageName: string,
  restaurantName: string,
): Promise<DishInsight> {
  const reply = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: buildPrompt(dish, languageName, restaurantName) }],
  });
  return DishInsightSchema.parse(parseJsonReply(reply));
}
