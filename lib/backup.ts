import type { DishGroup } from "@/lib/db/dish-groups";
import type { SavedDishTranslation } from "@/lib/db/owner-translations";
import type { LanguageCode } from "@/lib/languages";
import type { RestaurantProfile } from "@/lib/restaurant-profile";
import { BackupProfileSchema, type Backup, type BackupDish } from "@/types/backup";
import type { MenuItem } from "@/types/menu";

/**
 * A restaurant's whole menu in one file: its dishes with sizes, add-ons, and serving times, its
 * seasonal menus, the translations its team corrected, and its profile. Draft dishes and photos
 * are left out; confirmation isn't saved, since a restored dish always needs checking again.
 */
export function buildBackup(
  profile: RestaurantProfile,
  dishes: MenuItem[],
  groups: DishGroup[],
  corrected: (SavedDishTranslation & { language: LanguageCode })[],
  now = new Date(),
): Backup {
  const groupIndex = new Map(groups.map((group, index) => [group.id, index]));
  const kept = BackupProfileSchema.keyof().options;
  return {
    carte_backup: 1,
    exported_at: now.toISOString(),
    profile: Object.fromEntries(kept.map((key) => [key, profile[key]])) as Backup["profile"],
    seasonal_menus: groups.map(({ name, active }) => ({ name, active })),
    dishes: dishes
      .filter((dish) => !dish.draft)
      .map((dish): BackupDish => {
        const translations = Object.fromEntries(
          corrected
            .filter((row) => row.menu_item_id === dish.id)
            .map((row) => [
              row.language,
              {
                name: row.name,
                description: row.description,
                notes: row.notes,
                section: row.section,
                options: row.options,
              },
            ]),
        );
        return {
          name: dish.name,
          description: dish.description,
          price: dish.price,
          allergens: dish.allergens,
          dietary_tags: dish.dietary_tags,
          notes: dish.notes,
          source_language: dish.source_language,
          section: dish.section ?? "",
          special: dish.special ?? false,
          calories: dish.calories ?? null,
          spice: dish.spice ?? null,
          removable: dish.removable ?? [],
          may_contain: dish.may_contain ?? [],
          also_contains: dish.also_contains ?? [],
          sizes: dish.sizes ?? [],
          addons: dish.addons ?? [],
          available_from: dish.available_from ?? null,
          available_until: dish.available_until ?? null,
          seasonal_menu: dish.group_id ? (groupIndex.get(dish.group_id) ?? null) : null,
          ...(Object.keys(translations).length > 0 ? { translations } : {}),
        };
      }),
  };
}

/** Rows to add for a backup's dishes: always drafts, never confirmed, after `startOrder`. */
export function restoredDishRows(
  backup: Backup,
  restaurantId: string,
  groupIds: (string | null)[],
  startOrder: number,
) {
  return backup.dishes.map((dish, index) => {
    const { seasonal_menu, translations, ...text } = dish;
    void translations; // Saved separately, once the dishes exist.
    return {
      ...text,
      // Removable allergens must be in the dish, and "may contain" can't repeat them.
      removable: (dish.removable ?? []).filter((a) => dish.allergens.includes(a)),
      may_contain: (dish.may_contain ?? []).filter((a) => !dish.allergens.includes(a)),
      source_language: dish.source_language ?? "und",
      section: dish.section ?? "",
      restaurant_id: restaurantId,
      group_id: seasonal_menu == null ? null : (groupIds[seasonal_menu] ?? null),
      sort_order: startOrder + index,
      draft: true,
      confirmed: false,
    };
  });
}
