import { describe, expect, it } from "vitest";
import { KITCHEN_PRACTICES, practicesFor } from "@/lib/allergens";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { LANGUAGES } from "@/lib/languages";
import { normalizeProfile, ProfileSchema } from "@/lib/restaurant-profile";
import { createTestDatabase } from "./helpers/test-database";

describe("kitchen practices", () => {
  it("puts the ones about the diner's allergies first, and never leaves any out", () => {
    const shown = practicesFor(
      ["shared-fryer", "sesame-in-kitchen", "nuts-in-kitchen"],
      ["peanuts"],
    );
    expect(shown).toEqual([
      { practice: "nuts-in-kitchen", yours: true },
      { practice: "shared-fryer", yours: false },
      { practice: "sesame-in-kitchen", yours: false },
    ]);
  });

  it("marks none when the diner avoids nothing", () => {
    expect(practicesFor(["peanut-oil"], []).every((p) => !p.yours)).toBe(true);
  });

  it("has a written translation of every practice in every language", () => {
    for (const { code } of LANGUAGES) {
      expect(DINER_STRINGS[code].kitchenTitle).not.toBe("");
      for (const practice of KITCHEN_PRACTICES) {
        expect(DINER_STRINGS[code].kitchenPractices[practice].length).toBeGreaterThan(5);
      }
    }
  });

  it("only accepts practices from the list in a saved profile", () => {
    const base = normalizeProfile({});
    expect(base.kitchen_practices).toEqual([]);
    expect(ProfileSchema.safeParse({ ...base, kitchen_practices: ["shared-fryer"] }).success).toBe(
      true,
    );
    expect(ProfileSchema.safeParse({ ...base, kitchen_practices: ["nut-free"] }).success).toBe(
      false,
    );
  });

  it("is limited to the list in the database too", async () => {
    const db = await createTestDatabase();
    try {
      await db.exec(`
        insert into auth.users values ('00000000-0000-0000-0000-00000000000a');
        insert into public.restaurants (owner_id, name, slug)
          values ('00000000-0000-0000-0000-00000000000a', 'Cafe', 'cafe');
      `);
      await db.exec(
        `update public.restaurants set kitchen_practices = '{shared-fryer,peanut-oil}'`,
      );
      await expect(
        db.exec(`update public.restaurants set kitchen_practices = '{nut-free}'`),
      ).rejects.toThrow();
    } finally {
      await db.close();
    }
  }, 30000);
});
