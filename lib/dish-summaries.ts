import type { MenuItem } from "@/types/menu";

/** One-line dish explanations for the menu, by dish and version. */
export type DishSummaries = Record<string, string>;

/** Includes the dish's version, so a dish edited since its explanation never shows the old one. */
export function summaryKey(dish: Pick<MenuItem, "id" | "revision">): string {
  return `${dish.id}:${dish.revision ?? 0}`;
}
