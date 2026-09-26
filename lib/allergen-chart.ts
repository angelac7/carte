import { uncheckedAllergens, type Allergen, type OtherAvoid } from "@/lib/allergens";
import type { MenuItem } from "@/types/menu";

/** What a staff chart shows for one dish and one allergen. */
export type ChartCell = "contains" | "removable" | "may-contain" | "unchecked" | "none";

type ChartDish = Pick<MenuItem, "allergens" | "removable" | "may_contain" | "allergen_list">;

/** One square of the allergen chart, from the allergens the owner confirmed. */
export function allergenCell(dish: ChartDish, allergen: Allergen): ChartCell {
  if (dish.allergens.includes(allergen)) {
    return dish.removable?.includes(allergen) ? "removable" : "contains";
  }
  if (dish.may_contain?.includes(allergen)) return "may-contain";
  // Dishes confirmed before the newer allergens were added weren't checked for them.
  if (uncheckedAllergens(dish.allergen_list, [allergen]).length > 0) return "unchecked";
  return "none";
}

/** The same for other things diners avoid, like pork, which owners check separately. */
export function otherCell(
  dish: Pick<MenuItem, "also_contains" | "also_checked">,
  item: OtherAvoid,
): ChartCell {
  if (dish.also_contains?.includes(item)) return "contains";
  return dish.also_checked ? "none" : "unchecked";
}

/** The mark printed in each square; the chart's key explains them. */
export const CELL_MARKS: Record<ChartCell, string> = {
  contains: "●",
  removable: "◐",
  "may-contain": "△",
  unchecked: "?",
  none: "",
};
