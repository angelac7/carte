import { describe, expect, it } from "vitest";
import { buildBackup, restoredDishRows } from "@/lib/backup";
import { DEFAULT_PROFILE } from "@/lib/restaurant-profile";
import { BackupSchema } from "@/types/backup";
import type { MenuItem } from "@/types/menu";

const ramen: MenuItem = {
  id: "ramen-id",
  name: "Ramen",
  description: "Pork broth",
  price: "$15",
  allergens: ["wheat", "eggs"],
  dietary_tags: [],
  notes: "Shared fryer",
  confirmed: true,
  section: "Noodles",
  sizes: [{ label: "Large", price: "$18" }],
  addons: [{ label: "Add egg", price: "$2", allergens: ["eggs"] }],
  removable: ["eggs"],
  also_contains: ["pork"],
  group_id: "brunch-id",
  photo_url: "https://example.com/ramen.jpg",
  source_language: "en",
};
const groups = [{ id: "brunch-id", name: "Brunch", active: false }];
const corrected = [
  {
    menu_item_id: "ramen-id",
    language: "es" as const,
    source_hash: "hash",
    edited_at: "2026-09-27T00:00:00Z",
    name: "Ramen",
    description: "Caldo de cerdo",
    notes: "Freidora compartida",
    section: "Fideos",
    options: ["Grande", "Con huevo"],
  },
];

describe("backups", () => {
  const backup = buildBackup(
    { ...DEFAULT_PROFILE, name: "Maru", listed: true, description: "Noodles", revision: 4 },
    [ramen, { ...ramen, id: "draft-id", name: "New soup", draft: true }],
    groups,
    corrected,
    new Date("2026-09-27T12:00:00Z"),
  );

  it("saves every dish's text, options, seasonal menu, and corrected translations, but no drafts", () => {
    expect(BackupSchema.parse(JSON.parse(JSON.stringify(backup)))).toEqual(backup);
    expect(backup.dishes.map((dish) => dish.name)).toEqual(["Ramen"]);
    expect(backup.dishes[0]).toMatchObject({
      addons: ramen.addons,
      sizes: ramen.sizes,
      seasonal_menu: 0,
      translations: { es: { description: "Caldo de cerdo", options: ["Grande", "Con huevo"] } },
    });
    expect(backup.seasonal_menus).toEqual([{ name: "Brunch", active: false }]);
  });

  it("leaves out photos, confirmation, the restaurant's name, and whether it's listed", () => {
    const text = JSON.stringify(backup);
    for (const left of ["photo_url", "confirmed", "Maru", "listed", "revision"])
      expect(text).not.toContain(left);
    expect(backup.profile.description).toBe("Noodles");
  });

  it("restores dishes as unconfirmed drafts, in their seasonal menus", () => {
    const [row] = restoredDishRows(backup, "restaurant-id", ["new-brunch-id"], 7);
    expect(row).toMatchObject({
      name: "Ramen",
      restaurant_id: "restaurant-id",
      group_id: "new-brunch-id",
      sort_order: 7,
      draft: true,
      confirmed: false,
      removable: ["eggs"],
    });
    expect(row).not.toHaveProperty("translations");
    expect(row).not.toHaveProperty("seasonal_menu");
  });

  it("turns down files that aren't Carte backups", () => {
    expect(BackupSchema.safeParse({ dishes: [] }).success).toBe(false);
    expect(
      BackupSchema.safeParse({
        ...backup,
        dishes: [{ ...backup.dishes[0], allergens: ["gluten"] }],
      }).success,
    ).toBe(false);
  });
});
