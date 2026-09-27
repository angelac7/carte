import { expect, it } from "vitest";
import { summarizeAiUsage } from "@/lib/ai-usage-summary";

const row = (restaurant: string | null, feature: string, today: number, recent: number) => ({
  restaurant_id: restaurant,
  restaurant_name: restaurant && `${restaurant} name`,
  restaurant_slug: restaurant,
  feature,
  today,
  recent,
});

it("totals AI calls for all of Carte, each restaurant, and each feature", () => {
  const summary = summarizeAiUsage([
    row("cafe", "chat", 3, 40),
    row("cafe", "explain", 5, 9),
    row("bistro", "chat", 0, 100),
    row(null, "scan", 2, 2),
  ]);
  expect({ today: summary.today, recent: summary.recent }).toEqual({ today: 10, recent: 151 });
  expect(summary.restaurants.map((r) => [r.id, r.today, r.recent, r.busiest])).toEqual([
    ["cafe", 8, 49, "explain"],
    [null, 2, 2, "scan"],
    ["bistro", 0, 100, null],
  ]);
  expect(summary.features.map((f) => [f.feature, f.today])).toEqual([
    ["explain", 5],
    ["chat", 3],
    ["scan", 2],
  ]);
});
