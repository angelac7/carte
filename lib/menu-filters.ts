import {
  conflictingTags,
  uncheckedAllergens,
  type Allergen,
  type DietaryTag,
} from "@/lib/allergens";
import type { MenuItem } from "@/types/menu";

export type DinerFilters = { avoid: Allergen[]; onlyTags: DietaryTag[] };

/** Diners must only ever see dishes the owner has confirmed. */
export function confirmedOnly(dishes: MenuItem[]): MenuItem[] {
  return dishes.filter((dish) => dish.confirmed);
}

type FilterableDish = Pick<MenuItem, "allergens" | "dietary_tags"> & {
  allergen_list?: number;
  removable?: readonly Allergen[];
  may_contain?: readonly Allergen[];
};

export type FilterOptions = {
  /** Keep dishes whose avoided allergens can all be left out on request. The menu says so. */
  allowRemovable?: boolean;
  /** Keep dishes that may contain traces of an avoided allergen. The menu warns about them. */
  allowTraces?: boolean;
};

/**
 * Hides dishes with any avoided allergen, or never checked for one, and keeps only dishes with
 * every selected tag. A tag the dish's own allergens contradict (like vegan with fish) never counts.
 * By default it's strict, as every AI feature needs: dishes that would need an allergen left out,
 * or that may contain traces of one, are hidden too. Only the menu itself relaxes that, with labels.
 */
export function filterDishes<T extends FilterableDish>(
  dishes: T[],
  { avoid, onlyTags }: DinerFilters,
  { allowRemovable = false, allowTraces = false }: FilterOptions = {},
): T[] {
  return dishes.filter((dish) => {
    const contained = dish.allergens.filter((allergen) => avoid.includes(allergen));
    const leaveOut = allowRemovable && contained.every((a) => dish.removable?.includes(a));
    if (contained.length > 0 && !leaveOut) return false;
    if (!allowTraces && tracesOf(dish, avoid).length > 0) return false;
    if (uncheckedAllergens(dish.allergen_list, avoid).length > 0) return false;
    return onlyTags.every(
      (tag) =>
        dish.dietary_tags.includes(tag) && conflictingTags(dish.allergens, [tag]).length === 0,
    );
  });
}

/** Avoided allergens the diner must ask the kitchen to leave out of this dish. */
export function mustLeaveOut(dish: FilterableDish, avoid: readonly Allergen[]): Allergen[] {
  return dish.allergens.filter((allergen) => avoid.includes(allergen));
}

/** Avoided allergens this dish may contain traces of. */
export function tracesOf(dish: FilterableDish, avoid: readonly Allergen[]): Allergen[] {
  return (dish.may_contain ?? []).filter((allergen) => avoid.includes(allergen));
}
