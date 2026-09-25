import type { Allergen } from "@/lib/allergens";
import { parsePrice } from "@/lib/prices";
import type { MenuItem } from "@/types/menu";

/** What the diner picked for one order line: a size (by position) and add-ons (by position). */
export type LineChoice = { size: number | null; addons: number[] };

export type OrderLine = { key: string; dish: MenuItem; choice: LineChoice; quantity: number };

const NO_CHOICE: LineChoice = { size: null, addons: [] };

/**
 * The order is kept as quantities keyed by line. A plain dish's key is its id, so orders
 * without choices look exactly as they did; a dish with choices gets one line per combination.
 */
export function lineKey(dishId: string, choice: LineChoice = NO_CHOICE): string {
  if (choice.size === null && choice.addons.length === 0) return dishId;
  const addons = [...new Set(choice.addons)].sort((a, b) => a - b).join(".");
  return `${dishId}|${choice.size ?? ""}|${addons}`;
}

export function parseLineKey(key: string): { dishId: string; choice: LineChoice } {
  const [dishId, size = "", addons = ""] = key.split("|");
  return {
    dishId,
    choice: {
      size: size === "" ? null : Number(size),
      addons: addons === "" ? [] : addons.split(".").map(Number),
    },
  };
}

/** Whether a dish needs the diner to choose before it's added. */
export function hasChoices(dish: Pick<MenuItem, "sizes" | "addons">): boolean {
  return (dish.sizes?.length ?? 0) > 0 || (dish.addons?.length ?? 0) > 0;
}

/** The order's lines, in menu order, leaving out dishes and choices that no longer exist. */
export function orderLines(dishes: MenuItem[], order: Record<string, number>): OrderLine[] {
  const byId = new Map(dishes.map((dish) => [dish.id, dish]));
  const lines: OrderLine[] = [];
  for (const [key, quantity] of Object.entries(order)) {
    const { dishId, choice } = parseLineKey(key);
    const dish = byId.get(dishId);
    if (!dish || quantity <= 0) continue;
    const sizeOk = choice.size === null || choice.size < (dish.sizes?.length ?? 0);
    const addonsOk = choice.addons.every((index) => index < (dish.addons?.length ?? 0));
    if (sizeOk && addonsOk) lines.push({ key, dish, choice, quantity });
  }
  const position = new Map(dishes.map((dish, index) => [dish.id, index]));
  return lines.sort((a, b) => position.get(a.dish.id)! - position.get(b.dish.id)!);
}

/** How many of a dish are in the order, across all its choices. */
export function dishQuantity(order: Record<string, number>, dishId: string): number {
  return Object.entries(order).reduce(
    (sum, [key, quantity]) => (parseLineKey(key).dishId === dishId ? sum + quantity : sum),
    0,
  );
}

/** One line's price: the size's price (or the dish's), plus add-ons. Null if any part is unclear. */
export function linePrice(dish: MenuItem, choice: LineChoice): number | null {
  const size = choice.size === null ? null : dish.sizes?.[choice.size];
  const base = parsePrice(size ? size.price : dish.price);
  if (base === null) return null;
  let total = base;
  for (const index of choice.addons) {
    const addon = dish.addons?.[index];
    if (!addon) return null;
    // An add-on without a price is included; one with an unclear price makes the total unclear.
    if (!addon.price.trim()) continue;
    const price = parsePrice(addon.price);
    if (price === null) return null;
    total += price;
  }
  return Math.round(total * 100) / 100;
}

/** The size and add-on names for a line, like ["Large", "Add egg"], translated when available. */
export function choiceLabels(dish: MenuItem, choice: LineChoice, translated?: string[]): string[] {
  const sizes = dish.sizes ?? [];
  const label = (index: number, original: string) => translated?.[index] || original;
  return [
    ...(choice.size === null ? [] : [label(choice.size, sizes[choice.size]?.label ?? "")]),
    ...choice.addons.map((index) => label(sizes.length + index, dish.addons?.[index]?.label ?? "")),
  ].filter(Boolean);
}

/** Add-ons that contain something the diner avoids. They're shown but can't be picked. */
export function blockedAddons(dish: MenuItem, avoid: Allergen[]): number[] {
  return (dish.addons ?? []).flatMap((addon, index) =>
    addon.allergens.some((allergen) => avoid.includes(allergen)) ? [index] : [],
  );
}
