import type { AiUsageRow } from "@/lib/db/ai-usage";

export const AI_FEATURE_NAMES: Record<string, string> = {
  chat: "Menu assistant",
  recommend: "Ordering helper",
  explain: "Dish explanations",
  translate: "Menu translations",
  "photo-match": "Photo lookup",
  scan: "Paper menu scans",
  taste: "Taste profiles",
  craving: "Discover craving search",
  "menu-upload": "Owner menu uploads",
};

export type RestaurantUsage = {
  id: string | null;
  name: string;
  slug: string | null;
  today: number;
  recent: number;
  /** The feature with the most calls today, if any. */
  busiest: string | null;
};

/** Totals for the admin page: all of Carte, each restaurant, and each feature, busiest first. */
export function summarizeAiUsage(rows: AiUsageRow[]) {
  const restaurants = new Map<string, RestaurantUsage & { byFeature: Map<string, number> }>();
  const features = new Map<string, { feature: string; today: number; recent: number }>();
  for (const row of rows) {
    const key = row.restaurant_id ?? "none";
    const restaurant = restaurants.get(key) ?? {
      id: row.restaurant_id,
      name: row.restaurant_name ?? "No restaurant (scans, taste profiles, Discover)",
      slug: row.restaurant_slug,
      today: 0,
      recent: 0,
      busiest: null,
      byFeature: new Map<string, number>(),
    };
    restaurant.today += row.today;
    restaurant.recent += row.recent;
    restaurant.byFeature.set(row.feature, (restaurant.byFeature.get(row.feature) ?? 0) + row.today);
    restaurants.set(key, restaurant);
    const feature = features.get(row.feature) ?? { feature: row.feature, today: 0, recent: 0 };
    feature.today += row.today;
    feature.recent += row.recent;
    features.set(row.feature, feature);
  }
  const byRecent = <T extends { today: number; recent: number }>(a: T, b: T) =>
    b.today - a.today || b.recent - a.recent;
  return {
    today: rows.reduce((sum, row) => sum + row.today, 0),
    recent: rows.reduce((sum, row) => sum + row.recent, 0),
    restaurants: [...restaurants.values()]
      .map(({ byFeature, ...restaurant }) => {
        const [busiest] = [...byFeature]
          .filter(([, calls]) => calls > 0)
          .sort((a, b) => b[1] - a[1]);
        return { ...restaurant, busiest: busiest?.[0] ?? null };
      })
      .sort(byRecent),
    features: [...features.values()].sort(byRecent),
  };
}
