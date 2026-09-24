import type { Allergen, DietaryTag } from "@/lib/allergens";
import type { MenuItem } from "@/types/menu";

export type DinerFilters = { avoid: Allergen[]; onlyTags: DietaryTag[] };

/** Diners must only ever see dishes the owner has confirmed. */
export function confirmedOnly(dishes: MenuItem[]): MenuItem[] {
  return dishes.filter((dish) => dish.confirmed);
}

/** Hides dishes with any avoided allergen, and keeps only dishes with every selected tag. */
export function filterDishes(dishes: MenuItem[], { avoid, onlyTags }: DinerFilters): MenuItem[] {
  return dishes.filter(
    (dish) =>
      !dish.allergens.some((allergen) => avoid.includes(allergen)) &&
      onlyTags.every((tag) => dish.dietary_tags.includes(tag)),
  );
}
