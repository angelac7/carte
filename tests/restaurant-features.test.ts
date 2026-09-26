import { describe, expect, it } from "vitest";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { LANGUAGES } from "@/lib/languages";
import { normalizeProfile, ProfileSchema, RESTAURANT_FEATURES } from "@/lib/restaurant-profile";
import { menuStructuredData } from "@/lib/structured-data";
import { createTestDatabase } from "./helpers/test-database";

describe("accessibility and family info", () => {
  it("names each one in every language", () => {
    for (const { code } of LANGUAGES) {
      expect(DINER_STRINGS[code].featuresTitle).toBeTruthy();
      for (const feature of RESTAURANT_FEATURES) {
        expect(DINER_STRINGS[code].features[feature]).toBeTruthy();
      }
    }
  });

  it("only accepts features from the list in a saved profile", () => {
    const base = normalizeProfile({});
    expect(base.features).toEqual([]);
    expect(ProfileSchema.safeParse({ ...base, features: ["high-chairs"] }).success).toBe(true);
    expect(ProfileSchema.safeParse({ ...base, features: ["valet"] }).success).toBe(false);
  });

  it("go to search engines as amenities", () => {
    const data = menuStructuredData({ name: "T", url: "u", features: ["High chairs"], dishes: [] });
    expect(data.amenityFeature).toEqual([
      { "@type": "LocationFeatureSpecification", name: "High chairs", value: true },
    ]);
  });

  it("let Discover find restaurants with every chosen feature", async () => {
    const db = await createTestDatabase();
    try {
      await db.exec(`
        insert into auth.users values ('00000000-0000-0000-0000-00000000000a');
        insert into public.restaurants (owner_id, name, slug, listed, features) values
          ('00000000-0000-0000-0000-00000000000a', 'Ramp Cafe', 'ramp', true, '{wheelchair-access,step-free-entry}'),
          ('00000000-0000-0000-0000-00000000000a', 'Stairs Diner', 'stairs', true, '{high-chairs}');
        insert into public.menu_items (restaurant_id, name, description, confirmed)
          select id, 'Noodle soup', 'hot noodles', true from public.restaurants;
      `);
      const restaurants = async (features: string[]) =>
        (
          await db.query<{ slug: string; features: string[] }>(
            `select slug, features from public.search_restaurants('', with_features => $1::text[]) order by slug`,
            [features],
          )
        ).rows;
      expect((await restaurants([])).map((r) => r.slug)).toEqual(["ramp", "stairs"]);
      expect(await restaurants(["step-free-entry"])).toEqual([
        { slug: "ramp", features: ["wheelchair-access", "step-free-entry"] },
      ]);
      expect(await restaurants(["step-free-entry", "high-chairs"])).toEqual([]);

      const dishes = await db.query<{ restaurant_slug: string }>(
        `select restaurant_slug from public.search_dishes('noodles', with_features => '{high-chairs}')`,
      );
      expect(dishes.rows.map((r) => r.restaurant_slug)).toEqual(["stairs"]);

      // Callers from before this change still work.
      const old = await db.query(
        `select * from public.search_restaurants(search => '', result_limit => 30, avoid => '{}', only_tags => '{}', filter_city => '', filter_occasion => '', open_only => false)`,
      );
      expect(old.rows).toHaveLength(2);

      await expect(db.exec(`update public.restaurants set features = '{valet}'`)).rejects.toThrow();
    } finally {
      await db.close();
    }
  }, 30000);
});
