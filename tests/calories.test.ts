import { describe, expect, it } from "vitest";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { LANGUAGES } from "@/lib/languages";
import { formatCalories } from "@/lib/prices";
import { menuStructuredData } from "@/lib/structured-data";
import { MenuItemSchema } from "@/types/menu";
import { createTestDatabase } from "./helpers/test-database";

const dish = {
  id: "d",
  name: "Burger",
  description: "",
  price: "$12",
  allergens: [],
  dietary_tags: [],
  notes: "",
  confirmed: false,
};

describe("calories", () => {
  it("are an optional whole number the owner types, within reason", () => {
    expect(MenuItemSchema.safeParse({ ...dish, calories: 650 }).success).toBe(true);
    expect(MenuItemSchema.safeParse({ ...dish, calories: null }).success).toBe(true);
    expect(MenuItemSchema.safeParse(dish).success).toBe(true);
    expect(MenuItemSchema.safeParse({ ...dish, calories: -5 }).success).toBe(false);
    expect(MenuItemSchema.safeParse({ ...dish, calories: 12.5 }).success).toBe(false);
    expect(MenuItemSchema.safeParse({ ...dish, calories: 90000 }).success).toBe(false);
  });

  it("read naturally in every language, with the daily note", () => {
    expect(DINER_STRINGS.en.calories(formatCalories(1250, "en-US"))).toBe("1,250 cal");
    expect(DINER_STRINGS.de.calories(formatCalories(1250, "de-DE"))).toBe("1.250 kcal");
    for (const { code } of LANGUAGES) {
      expect(DINER_STRINGS[code].calories("650")).toContain("650");
      expect(DINER_STRINGS[code].caloriesNote).toMatch(/2[,.\s]?000/);
    }
  });

  it("go to search engines as nutrition information", () => {
    const data = menuStructuredData({
      name: "T",
      url: "u",
      dishes: [{ ...dish, section: "", calories: 650 }],
    });
    expect(data.hasMenu.hasMenuSection[0].hasMenuItem[0]).toMatchObject({
      nutrition: { "@type": "NutritionInformation", calories: "650 calories" },
    });
  });

  it("are checked by the database, and changing them needs a fresh review", async () => {
    const db = await createTestDatabase();
    try {
      await db.exec(`
        insert into auth.users values ('00000000-0000-0000-0000-00000000000a');
        insert into public.restaurants (owner_id, name, slug)
          values ('00000000-0000-0000-0000-00000000000a', 'Cafe', 'cafe');
        insert into public.menu_items (restaurant_id, name, confirmed)
          select id, 'Burger', true from public.restaurants;
      `);
      await expect(db.exec(`update public.menu_items set calories = -1`)).rejects.toThrow();
      await db.exec(`update public.menu_items set calories = 650`);
      const { rows } = await db.query<{ confirmed: boolean; calories: number }>(
        "select confirmed, calories from public.menu_items",
      );
      expect(rows[0]).toEqual({ confirmed: false, calories: 650 });
    } finally {
      await db.close();
    }
  }, 30000);
});
