import type { MenuItem } from "@/types/menu";

export type MenuSection<T> = { section: string; dishes: T[] };

/**
 * Groups dishes under their menu headings, in the order each heading first appears. Dishes
 * are expected in the owner's order already; dishes without a heading form their own group.
 */
export function groupBySection<T extends Pick<MenuItem, "section">>(dishes: T[]): MenuSection<T>[] {
  const groups = new Map<string, T[]>();
  for (const dish of dishes) {
    const section = dish.section?.trim() ?? "";
    const group = groups.get(section);
    if (group) group.push(dish);
    else groups.set(section, [dish]);
  }
  return [...groups].map(([section, grouped]) => ({ section, dishes: grouped }));
}

/** Headings only help when the menu actually has sections. */
export function hasSections(groups: MenuSection<unknown>[]): boolean {
  return groups.some((group) => group.section !== "");
}

/** The menu in display order: grouped by heading, each heading's dishes in the owner's order. */
function flatten<T>(groups: MenuSection<T>[]): T[] {
  return groups.flatMap((group) => group.dishes);
}

/** Moves a dish one place up (-1) or down (1) within its own section. */
export function moveDish<T extends Pick<MenuItem, "id" | "section">>(
  dishes: T[],
  id: string,
  direction: -1 | 1,
): T[] {
  const groups = groupBySection(dishes);
  for (const group of groups) {
    const index = group.dishes.findIndex((dish) => dish.id === id);
    const target = index + direction;
    if (index === -1) continue;
    if (target < 0 || target >= group.dishes.length) return flatten(groups);
    [group.dishes[index], group.dishes[target]] = [group.dishes[target], group.dishes[index]];
    return flatten(groups);
  }
  return flatten(groups);
}

/** Moves a whole section, with all its dishes, one place up (-1) or down (1). */
export function moveSection<T extends Pick<MenuItem, "section">>(
  dishes: T[],
  sectionIndex: number,
  direction: -1 | 1,
): T[] {
  const groups = groupBySection(dishes);
  const target = sectionIndex + direction;
  if (sectionIndex < 0 || target < 0 || target >= groups.length) return flatten(groups);
  [groups[sectionIndex], groups[target]] = [groups[target], groups[sectionIndex]];
  return flatten(groups);
}
