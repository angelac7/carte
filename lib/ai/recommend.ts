import { createMessage, parseJsonReply } from "@/lib/ai/client";
import { jsonReply, list, object, string } from "@/lib/ai/json-schema";
import { detectCurrency } from "@/lib/prices";
import type { MenuItem } from "@/types/menu";
import {
  RecommendationSchema,
  type Recommendation,
  type RecommendRequest,
} from "@/types/recommend";

const RECOMMENDATION_SCHEMA = object({
  picks: list(object({ id: string, reason: string })),
  note: string,
});

const HUNGER_WORDS = { light: "a little hungry", hungry: "hungry", very: "very hungry" } as const;

function buildPrompt(
  dishes: MenuItem[],
  request: RecommendRequest,
  languageName: string,
  restaurantName: string,
): string {
  const menu = dishes.map(({ id, name, description, price, dietary_tags }) => ({
    id,
    name,
    description,
    price,
    dietary_tags,
  }));
  const budget = request.budget
    ? `about ${detectCurrency(dishes.map((d) => d.price))}${request.budget} per person`
    : "no set budget";

  return `You help diners at ${restaurantName} decide what to order. Reply in ${languageName}.
Diners: a party of ${request.people}, ${HUNGER_WORDS[request.hunger]}, spice tolerance ${request.spice} out of 3 (0 means no spice), ${budget}.

Only choose from these dishes. They already match the diners' allergy and diet filters:
${JSON.stringify(menu)}

Rules:
- Pick 2 to 5 dishes that together suit the whole party, respecting spice tolerance, and budget where prices are listed.
- For each pick, give one short reason (under 20 words) in ${languageName}.
- Never claim a dish is safe for any allergy or diet.
- note: one short sentence of overall advice in ${languageName}, such as how many dishes to share, or "" if none.

Return ONLY valid JSON, no other text, in this format:
{"picks":[{"id":"","reason":""}],"note":""}`;
}

/** Suggests dishes from an already-filtered list, so picks always respect the diner's filters. */
export async function recommendDishes(
  dishes: MenuItem[],
  request: RecommendRequest,
  languageName: string,
  restaurantName: string,
): Promise<Recommendation> {
  const reply = await createMessage({
    max_tokens: 6000,
    output_config: jsonReply(RECOMMENDATION_SCHEMA, "high"),
    messages: [
      { role: "user", content: buildPrompt(dishes, request, languageName, restaurantName) },
    ],
  });
  const recommendation = RecommendationSchema.parse(parseJsonReply(reply));
  const allowed = new Set(dishes.map((dish) => dish.id));
  return { ...recommendation, picks: recommendation.picks.filter((pick) => allowed.has(pick.id)) };
}
