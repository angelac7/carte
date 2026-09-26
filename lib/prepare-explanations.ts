import "server-only";
import { explainDish } from "@/lib/ai/explain";
import { dishesWithoutInsight, saveInsight } from "@/lib/db/insights";
import { languageName, type LanguageCode } from "@/lib/languages";
import { checkRateLimit } from "@/lib/rate-limit";
import type { MenuItem } from "@/types/menu";
import { reportError } from "@/lib/report-error";

/** How many dishes are explained at the same time, so a long menu doesn't flood the AI. */
const AT_ONCE = 4;
/** One attempt per dish in this window, so overlapping runs and failures don't repeat work. */
const RETRY_AFTER_MS = 10 * 60 * 1000;

/**
 * Writes explanations ahead of time for confirmed dishes that don't have a current one, so
 * diners see them on the menu and the details open instantly. Returns how many were written.
 * A dish that fails is skipped and tried again on a later run.
 */
export async function prepareExplanations(
  dishes: MenuItem[],
  restaurantName: string,
  language: LanguageCode = "en",
): Promise<number> {
  const missing = await dishesWithoutInsight(
    dishes.filter((dish) => dish.confirmed),
    language,
  );
  let written = 0;
  for (let start = 0; start < missing.length; start += AT_ONCE) {
    await Promise.all(
      missing.slice(start, start + AT_ONCE).map(async (dish) => {
        try {
          const key = `prepare-explanation:${dish.id}:${language}`;
          if (!(await checkRateLimit(key, 1, RETRY_AFTER_MS))) return;
          const insight = await explainDish(dish, languageName(language), restaurantName);
          await saveInsight(dish, language, insight);
          written++;
        } catch (err) {
          reportError("Preparing a dish explanation failed", err, { dish: dish.name });
        }
      }),
    );
  }
  return written;
}
