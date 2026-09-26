import { ALLERGEN_LIST_VERSION, conflictingTags } from "@/lib/allergens";
import { optionLabels, translationHash } from "@/lib/source-hash";
import type { LanguageCode } from "@/lib/languages";
import type { MenuItem } from "@/types/menu";
import type { TranslatedText } from "@/types/translation";

export type SavedTranslation = TranslatedText & { menu_item_id: string; source_hash: string };
export const REVIEW_INTERVAL_DAYS = 90;
export function reviewDue(date: string | undefined, now: number): boolean {
  const time = date ? Date.parse(date) : NaN;
  return !Number.isFinite(time) || time > now || now - time >= REVIEW_INTERVAL_DAYS * 86400000;
}
export function translationComplete(dish: MenuItem, row?: SavedTranslation): boolean {
  return (
    !!row &&
    row.source_hash === translationHash(dish) &&
    !!row.name.trim() &&
    (!dish.description.trim() || !!row.description.trim()) &&
    (!dish.notes.trim() || !!row.notes.trim()) &&
    (!dish.section?.trim() || !!row.section.trim()) &&
    row.options.length === optionLabels(dish).length &&
    row.options.every((label) => !!label.trim())
  );
}
/** Advisory checks: absence of notes is a prompt to ask the kitchen, never a safety verdict. */
export function publishChecklist(
  dishes: MenuItem[],
  reviews: Record<string, string>,
  translations: SavedTranslation[],
  language: LanguageCode,
  now: number,
) {
  const saved = new Map(translations.map((row) => [row.menu_item_id, row]));
  return {
    unconfirmed: dishes.filter(
      (d) => !d.confirmed || d.allergen_list !== ALLERGEN_LIST_VERSION || !d.also_checked,
    ),
    notes: dishes.filter((d) => !d.notes.trim()),
    conflicts: dishes.filter((d) => conflictingTags(d.allergens, d.dietary_tags).length > 0),
    translations: dishes.filter(
      (d) =>
        d.confirmed && d.source_language !== language && !translationComplete(d, saved.get(d.id)),
    ),
    due: dishes.filter((d) => d.confirmed && reviewDue(reviews[d.id], now)),
  };
}
