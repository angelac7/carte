/** A dish's allergen information at one point in its history, as the database recorded it. */
export type DishSafety = {
  allergens: string[];
  may_contain: string[];
  removable: string[];
  dietary_tags: string[];
  /** Missing from versions recorded before diners could avoid pork, alcohol, and the like. */
  also_contains?: string[];
  allergen_list: number;
  addon_allergens: { label: string; allergens: string[] }[];
};

export type HistoryAction = "recorded" | "added" | "edited" | "confirmed" | "deleted";

export type DishHistoryEntry = {
  id: number;
  menu_item_id: string;
  dish_name: string;
  action: HistoryAction;
  changed_by: string | null;
  changed_at: string;
  safety: DishSafety;
};

/** The parts of a dish's allergen information the history compares. */
export const HISTORY_FIELDS = [
  "allergens",
  "may_contain",
  "removable",
  "dietary_tags",
  "also_contains",
] as const;
export type HistoryField = (typeof HISTORY_FIELDS)[number];

/** One part that changed: a field, or the allergens of one add-on. Values are list codes. */
export type ChangeLine = {
  field: HistoryField | "addon";
  addon?: string;
  added: string[];
  removed: string[];
  now: string[];
};

const diff = (before: readonly string[], now: readonly string[]) => ({
  added: now.filter((value) => !before.includes(value)),
  removed: before.filter((value) => !now.includes(value)),
});

/**
 * What changed in each part of a dish's allergen information. With nothing earlier to compare
 * to, everything it lists counts as added.
 */
export function describeChange(previous: DishSafety | null, current: DishSafety): ChangeLine[] {
  const lines: ChangeLine[] = HISTORY_FIELDS.map((field) => {
    const now = current[field] ?? [];
    return { field, ...diff(previous?.[field] ?? [], now), now };
  });
  const addons = (safety: DishSafety | null) =>
    new Map((safety?.addon_allergens ?? []).map((a) => [a.label, a.allergens]));
  const [before, now] = [addons(previous), addons(current)];
  for (const [label, allergens] of now) {
    lines.push({
      field: "addon",
      addon: label,
      ...diff(before.get(label) ?? [], allergens),
      now: allergens,
    });
  }
  for (const [label, allergens] of before) {
    if (!now.has(label))
      lines.push({ field: "addon", addon: label, added: [], removed: allergens, now: [] });
  }
  return lines.filter((line) => line.added.length > 0 || line.removed.length > 0);
}

/**
 * Pairs each entry with the one before it for the same dish, so a page can show what changed.
 * Entries come newest first; an entry whose earlier version isn't in the list gets null.
 */
export function withPrevious(entries: DishHistoryEntry[]) {
  return entries.map((entry, index) => ({
    entry,
    previous:
      entries.slice(index + 1).find((older) => older.menu_item_id === entry.menu_item_id) ?? null,
  }));
}

/** Each dish's newest entry, by dish: what the dish says right now. */
export function latestEntryByDish(entries: DishHistoryEntry[]): Map<string, number> {
  const latest = new Map<string, number>();
  for (const entry of entries) {
    if (!latest.has(entry.menu_item_id)) latest.set(entry.menu_item_id, entry.id);
  }
  return latest;
}

/** The newest entry for each dish: what the dish says right now, so there's nothing to go back to. */
export function latestEntryIds(entries: DishHistoryEntry[]): Set<number> {
  return new Set(latestEntryByDish(entries).values());
}

/**
 * A dish's current add-ons with the allergens an earlier version recorded for them, matched by
 * name. Versions only record add-ons that had allergens, so an add-on the version doesn't name
 * either had none then or didn't exist yet; it keeps its current allergens, erring toward telling
 * diners more. `unsure` means the owner should check the add-ons: one from that version is gone,
 * or one keeps allergens the version can't account for.
 */
export function restoreAddonAllergens<Addon extends { label: string; allergens: string[] }>(
  addons: Addon[],
  recorded: DishSafety["addon_allergens"],
): { addons: Addon[]; unsure: boolean } {
  const earlier = new Map(recorded.map((addon) => [addon.label, addon.allergens]));
  const labels = new Set(addons.map((addon) => addon.label));
  const unsure =
    recorded.some((addon) => !labels.has(addon.label)) ||
    addons.some((addon) => !earlier.has(addon.label) && addon.allergens.length > 0);
  return {
    addons: addons.map((addon) => {
      const allergens = earlier.get(addon.label);
      return allergens ? { ...addon, allergens } : addon;
    }),
    unsure,
  };
}
