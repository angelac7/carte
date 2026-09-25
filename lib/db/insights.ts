import "server-only";
import { summaryKey, type DishSummaries } from "@/lib/dish-summaries";
import type { LanguageCode } from "@/lib/languages";
import { sourceHash } from "@/lib/source-hash";
import { createAdminClient } from "@/lib/supabase/admin";
import { DishInsightSchema, type DishInsight } from "@/types/insight";
import type { MenuItem } from "@/types/menu";

type InsightRow = { menu_item_id: string; source_hash: string; insight: unknown };

/** Raised when explanations gain new parts, so ones written before are written again. */
const INSIGHT_FORMAT = 2;

/** Whether a saved explanation matches the dish as it is now, in the current format. */
function isCurrent(row: Omit<InsightRow, "menu_item_id">, dish: MenuItem): boolean {
  const format = (row.insight as { format?: unknown } | null)?.format;
  return row.source_hash === sourceHash(dish) && format === INSIGHT_FORMAT;
}

/** A saved explanation, or null if there isn't one or the dish has changed since. */
export async function getCachedInsight(
  dish: MenuItem,
  language: LanguageCode,
): Promise<DishInsight | null> {
  const { data, error } = await createAdminClient()
    .from("dish_insights")
    .select("source_hash, insight")
    .eq("menu_item_id", dish.id)
    .eq("language", language)
    .maybeSingle();
  if (error) throw error;

  const row = data as { source_hash: string; insight: unknown } | null;
  if (!row || !isCurrent(row, dish)) return null;
  const parsed = DishInsightSchema.safeParse(row.insight);
  return parsed.success ? parsed.data : null;
}

/** Matches saved explanations to dishes, skipping any written before the dish last changed. */
export function currentInsights(rows: InsightRow[], dishes: MenuItem[]): Map<string, DishInsight> {
  const byDish = new Map(rows.map((row) => [row.menu_item_id, row]));
  const found = new Map<string, DishInsight>();
  for (const dish of dishes) {
    const row = byDish.get(dish.id);
    if (!row || !isCurrent(row, dish)) continue;
    const parsed = DishInsightSchema.safeParse(row.insight);
    if (parsed.success) found.set(dish.id, parsed.data);
  }
  return found;
}

async function getCurrentInsights(
  dishes: MenuItem[],
  language: LanguageCode,
): Promise<Map<string, DishInsight>> {
  if (dishes.length === 0) return new Map();
  const { data, error } = await createAdminClient()
    .from("dish_insights")
    .select("menu_item_id, source_hash, insight")
    .in(
      "menu_item_id",
      dishes.map((dish) => dish.id),
    )
    .eq("language", language);
  if (error) throw error;
  return currentInsights((data ?? []) as InsightRow[], dishes);
}

/** The one-line explanation for each dish that already has one, shown on the menu itself. */
export async function getCachedSummaries(
  dishes: MenuItem[],
  language: LanguageCode,
): Promise<DishSummaries> {
  const summaries: DishSummaries = {};
  const found = await getCurrentInsights(dishes, language);
  for (const dish of dishes) {
    const summary = found.get(dish.id)?.summary;
    if (summary) summaries[summaryKey(dish)] = summary;
  }
  return summaries;
}

/** Dishes with no explanation in this language yet, or only one written before an edit. */
export async function dishesWithoutInsight(
  dishes: MenuItem[],
  language: LanguageCode,
): Promise<MenuItem[]> {
  const found = await getCurrentInsights(dishes, language);
  return dishes.filter((dish) => !found.has(dish.id));
}

export async function saveInsight(
  dish: MenuItem,
  language: LanguageCode,
  insight: DishInsight,
): Promise<void> {
  const { error } = await createAdminClient()
    .from("dish_insights")
    .upsert(
      {
        menu_item_id: dish.id,
        language,
        source_hash: sourceHash(dish),
        insight: { ...insight, format: INSIGHT_FORMAT },
      },
      { onConflict: "menu_item_id,language" },
    );
  if (error) throw error;
}
