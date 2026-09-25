import { parsePrice } from "@/lib/prices";
import type { MenuItem } from "@/types/menu";

/** Preferences that aren't about safety: how spicy, and how much. Empty means any. */
export type ComfortFilters = { maxSpice: number | null; maxPrice: number | null };

/** The lowest price a dish can be ordered at: its own price, or its cheapest size. */
export function startingPrice(dish: Pick<MenuItem, "price" | "sizes">): number | null {
  const prices = [dish.price, ...(dish.sizes ?? []).map((size) => size.price)]
    .map(parsePrice)
    .filter((price): price is number => price !== null && price > 0);
  return prices.length > 0 ? Math.min(...prices) : null;
}

/**
 * Keeps dishes within the diner's spice and price limits. A dish whose spice or price isn't known
 * stays visible, since there's nothing to judge it by.
 */
export function withinComfort<T extends Pick<MenuItem, "price" | "sizes" | "spice">>(
  dishes: T[],
  { maxSpice, maxPrice }: ComfortFilters,
): T[] {
  return dishes.filter((dish) => {
    if (maxSpice !== null && dish.spice != null && dish.spice > maxSpice) return false;
    const price = startingPrice(dish);
    return maxPrice === null || price === null || price < maxPrice;
  });
}

/** The smallest price-like round number at or above a value, like 10, 15, 20, or 1,500. */
function roundUp(value: number): number {
  const power = 10 ** Math.floor(Math.log10(value));
  return [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
    .map((step) => step * power)
    .find((nice) => nice >= value)!;
}

/**
 * "Under" amounts that suit this menu's own prices, so they work in dollars, yen, or won alike.
 * Each one leaves out some dishes; menus with too few prices get none.
 */
export function priceSteps(prices: (number | null)[]): number[] {
  const known = prices
    .filter((price): price is number => price !== null && price > 0)
    .sort((a, b) => a - b);
  if (known.length < 4) return [];
  const highest = known[known.length - 1];
  const steps = [0.34, 0.67, 0.9].map((q) => roundUp(known[Math.floor(q * (known.length - 1))]));
  return [...new Set(steps)].filter((step) => step > known[0] && step <= highest);
}
