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

export const ACTION_LABELS: Record<HistoryAction, string> = {
  recorded: "History started",
  added: "Added",
  edited: "Changed",
  confirmed: "Confirmed",
  deleted: "Deleted",
};

const FIELDS = [
  ["allergens", "Contains"],
  ["may_contain", "May contain"],
  ["removable", "Can leave out"],
  ["dietary_tags", "Diet labels"],
  ["also_contains", "Also contains"],
] as const;

export type ChangeLine = { label: string; added: string[]; removed: string[]; now: string[] };

/**
 * What changed in each part of a dish's allergen information. With nothing earlier to compare
 * to, everything it lists counts as added.
 */
export function describeChange(previous: DishSafety | null, current: DishSafety): ChangeLine[] {
  const lines: ChangeLine[] = FIELDS.map(([field, label]) => {
    const before = previous?.[field] ?? [];
    const now = current[field] ?? [];
    return {
      label,
      added: now.filter((value) => !before.includes(value)),
      removed: before.filter((value) => !now.includes(value)),
      now,
    };
  });
  const addons = (safety: DishSafety | null) =>
    new Map((safety?.addon_allergens ?? []).map((a) => [a.label, a.allergens.join(", ")]));
  const [before, now] = [addons(previous), addons(current)];
  for (const [label, allergens] of now) {
    const earlier = before.get(label);
    if (earlier !== allergens) {
      lines.push({
        label: `Add-on “${label}” contains`,
        added: [allergens],
        removed: earlier ? [earlier] : [],
        now: [allergens],
      });
    }
  }
  for (const [label, allergens] of before) {
    if (!now.has(label)) {
      lines.push({ label: `Add-on “${label}” contains`, added: [], removed: [allergens], now: [] });
    }
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

/** The newest entry for each dish: what the dish says right now, so there's nothing to go back to. */
export function latestEntryIds(entries: DishHistoryEntry[]): Set<number> {
  const seen = new Set<string>();
  const latest = new Set<number>();
  for (const entry of entries) {
    if (!seen.has(entry.menu_item_id)) {
      seen.add(entry.menu_item_id);
      latest.add(entry.id);
    }
  }
  return latest;
}
