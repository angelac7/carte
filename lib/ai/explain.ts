import { createMessage, parseJsonReply } from "@/lib/ai/client";
import { integer, jsonReply, list, object, oneOf, string } from "@/lib/ai/json-schema";
import { DishInsightSchema, type DishInsight } from "@/types/insight";
import type { MenuItem } from "@/types/menu";

const INSIGHT_SCHEMA = object({
  summary: string,
  taste: string,
  background: string,
  nativeName: string,
  nativeLang: string,
  phonetic: string,
  nameMeaning: string,
  spice: integer,
  richness: integer,
  portion: oneOf(["small", "single", "share"]),
  portionNote: string,
  glossary: list(object({ term: string, meaning: string })),
  pairings: list(string),
  askKitchen: list(string),
});

function buildPrompt(dish: MenuItem, languageName: string, restaurantName: string): string {
  const source = { name: dish.name, description: dish.description, kitchen_notes: dish.notes };
  return `You explain restaurant dishes to diners in ${languageName}.
This dish is from the menu at ${restaurantName}:
${JSON.stringify(source)}

Write for someone who has never had this dish and may not know the words on the menu. Rules:
- Base everything on the menu description and kitchen notes. You may add widely known general facts about this kind of dish, phrased as typical ("usually", "traditionally").
- Never state or guess allergens, and never call the dish safe for any diet. The restaurant shows confirmed allergens separately.
- summary: one plain sentence of at most 20 words saying what the dish is in everyday words, such as "A Korean noodle soup with clams and sea bream in a light broth." It is shown on the menu next to the dish, so it must make sense on its own.
- nameMeaning: what the dish's name means or refers to, such as "Ssam bap means 'wrapped rice' in Korean." Return "" if the name is already plain, like "Grilled chicken".
- glossary: every word in the name or description a typical diner might not know, such as foreign words, cooking techniques, and less common ingredients (for example tobiko, kikurage, or sauce américaine), each with a short plain meaning. Write each term as it appears on the menu. Skip everyday words. Up to 8 terms.
- askKitchen: only questions or requests supported by the kitchen notes or description, such as "Ask if the sauce can come on the side." If nothing fits, return [].
- nativeName: the dish name in its original language's script if it comes from a non-English cuisine (for example 쌈밥 for ssam bap); otherwise the name as written. nativeLang: its BCP 47 code, such as "ko-KR" or "en-US". phonetic: a simple English-style pronunciation guide, such as "SAHM-bahp".
- spice and richness: 0 (none) to 3 (very), estimated from the listed ingredients.
- portion: "small" for small plates, "share" if usually shared, otherwise "single".
- Write summary, nameMeaning, taste, background, portionNote, glossary meanings, pairings, and askKitchen in ${languageName}. Keep each text field to one or two short sentences.

Return ONLY valid JSON, no other text, in this format:
{"summary":"","taste":"","background":"","nativeName":"","nativeLang":"","phonetic":"","nameMeaning":"","spice":0,"richness":0,"portion":"single","portionNote":"","glossary":[{"term":"","meaning":""}],"pairings":[],"askKitchen":[]}`;
}

/** Explains a dish for diners. Allergens are never included; they come from the restaurant. */
export async function explainDish(
  dish: MenuItem,
  languageName: string,
  restaurantName: string,
): Promise<DishInsight> {
  // Saved per dish and language, so the careful setting is paid for once.
  const reply = await createMessage({
    max_tokens: 8000,
    output_config: jsonReply(INSIGHT_SCHEMA, "high"),
    messages: [{ role: "user", content: buildPrompt(dish, languageName, restaurantName) }],
  });
  return DishInsightSchema.parse(parseJsonReply(reply));
}
