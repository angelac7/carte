import "server-only";
import { consumeAiCall } from "@/lib/db/ai-usage";
import { reportError } from "@/lib/report-error";

/** Everything Carte uses AI for, as counted on the admin page. */
export type AiFeature =
  | "chat"
  | "recommend"
  | "explain"
  | "translate"
  | "photo-match"
  | "scan"
  | "taste"
  | "craving"
  | "menu-upload";

const positive = (value: string | undefined, fallback: number) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

/**
 * The most AI calls one restaurant, and all of Carte, can use in a day (UTC). Change them with
 * AI_DAILY_LIMIT_PER_RESTAURANT and AI_DAILY_LIMIT in Vercel's environment variables.
 */
export function aiLimits() {
  return {
    perRestaurant: positive(process.env.AI_DAILY_LIMIT_PER_RESTAURANT, 500),
    total: positive(process.env.AI_DAILY_LIMIT, 3000),
  };
}

/**
 * Counts one AI call and says whether it may go ahead. When a limit is reached, callers answer
 * the way they do for too many requests. If the count can't be checked, the call doesn't happen,
 * like the rate limits: an outage should never become an open bill.
 */
export async function allowAiCall(feature: AiFeature, restaurantId: string | null) {
  try {
    const limits = aiLimits();
    return await consumeAiCall(restaurantId, feature, limits.perRestaurant, limits.total);
  } catch (error) {
    reportError("AI limit check unavailable", error);
    return false;
  }
}
