import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getOwnerContext: vi.fn(), updateDish: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  after: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getOwnerContext: mocks.getOwnerContext }));
vi.mock("@/lib/db", () => ({ updateDish: mocks.updateDish }));
vi.mock("@/lib/prepare-explanations", () => ({ prepareExplanations: vi.fn() }));
vi.mock("@/lib/storage/dish-photos", () => ({ deleteStoredPhoto: vi.fn() }));
vi.mock("@/lib/db/photos", () => ({ getDishPhoto: vi.fn() }));
import { PUT } from "@/app/api/items/route";
import { OTHER_AVOIDS } from "@/lib/allergens";
import { parsePrefs, serializePrefs, EMPTY_PREFS } from "@/lib/diner-prefs";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import { LANGUAGES } from "@/lib/languages";
import { alsoUnchecked, filterDishes } from "@/lib/menu-filters";
import type { MenuItem } from "@/types/menu";
import { ChatRequestSchema } from "@/types/chat";
import { RecommendRequestSchema } from "@/types/recommend";
import { createTestDatabase } from "./helpers/test-database";

const dish: MenuItem = {
  id: "3f0c9a4e-2b1d-4c8e-9f6a-7d5b3c2a1e0f",
  revision: 2,
  name: "Stew",
  description: "",
  price: "",
  allergens: [],
  dietary_tags: [],
  notes: "",
  confirmed: true,
};
const pork = { ...dish, id: "pork", also_contains: ["pork" as const], also_checked: true };
const checked = { ...dish, id: "checked", also_contains: [], also_checked: true };
const unchecked = { ...dish, id: "unchecked" };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getOwnerContext.mockResolvedValue({ supabase: {}, restaurant: { id: "r", name: "Cafe" } });
  mocks.updateDish.mockImplementation(async (_s, _r, saved) => saved);
});

describe("other things diners avoid", () => {
  it("names each one in every language", () => {
    for (const { code } of LANGUAGES) {
      expect(DINER_STRINGS[code].alsoAvoidTitle).toBeTruthy();
      expect(DINER_STRINGS[code].alsoUnchecked("x")).toContain("x");
      for (const item of OTHER_AVOIDS) expect(DINER_STRINGS[code].alsoAvoid[item]).toBeTruthy();
      expect(TABLE_STRINGS[code].alsoAvoidStatement).toBeTruthy();
      expect(TABLE_STRINGS[code].chooseAlsoAvoid).toBeTruthy();
    }
  });

  it("hides dishes that have them, and for AI, dishes never checked for them", () => {
    const filters = { avoid: [], onlyTags: [], alsoAvoid: ["pork" as const] };
    expect(filterDishes([pork, checked, unchecked], filters)).toEqual([checked]);
    expect(filterDishes([pork, checked, unchecked], filters, { allowUncheckedAlso: true })).toEqual(
      [checked, unchecked],
    );
    expect(filterDishes([pork, checked, unchecked], { avoid: [], onlyTags: [] })).toHaveLength(3);
  });

  it("says which ones a dish hasn't been checked for", () => {
    expect(alsoUnchecked(unchecked, ["pork", "alcohol"])).toEqual(["pork", "alcohol"]);
    expect(alsoUnchecked(checked, ["pork"])).toEqual([]);
  });

  it("are remembered on the diner's device, ignoring anything unknown", () => {
    const saved = parsePrefs(serializePrefs({ ...EMPTY_PREFS, alsoAvoid: ["alcohol"] }));
    expect(saved.alsoAvoid).toEqual(["alcohol"]);
    expect(
      parsePrefs(serializePrefs({ ...EMPTY_PREFS, alsoAvoid: ["kiwi"] } as never)).alsoAvoid,
    ).toEqual([]);
    expect(parsePrefs(JSON.stringify({ avoid: ["milk"] })).alsoAvoid).toEqual([]);
  });

  it("reach the AI features, which filter with them first", () => {
    const base = { restaurant: "cafe", language: "en" };
    expect(
      ChatRequestSchema.parse({ ...base, messages: [{ role: "user", content: "hi" }] }).alsoAvoid,
    ).toEqual([]);
    expect(
      RecommendRequestSchema.safeParse({
        ...base,
        avoid: [],
        onlyTags: [],
        alsoAvoid: ["beer"],
        hunger: "hungry",
        spice: 1,
        people: 2,
        budget: null,
      }).success,
    ).toBe(false);
  });

  it("are marked checked only when the owner presses Confirm", async () => {
    const put = (body: unknown) =>
      PUT(new Request("http://localhost/api/items", { method: "PUT", body: JSON.stringify(body) }));
    await put({ ...dish, also_contains: ["pork"], also_checked: true });
    expect(mocks.updateDish.mock.calls[0][2].also_checked).toBeUndefined();
    expect(mocks.updateDish.mock.calls[0][2].also_contains).toEqual(["pork"]);
    await put({ ...dish, confirm: true });
    expect(mocks.updateDish.mock.calls[1][2].also_checked).toBe(true);
    await put({ ...dish, confirmed: false, confirm: true });
    expect(mocks.updateDish.mock.calls[2][2].also_checked).toBeUndefined();
  });

  it("are limited to the list in the database, and changing them needs a fresh review", async () => {
    const db = await createTestDatabase();
    try {
      await db.exec(`
        insert into auth.users values ('00000000-0000-0000-0000-00000000000a');
        insert into public.restaurants (owner_id, name, slug)
          values ('00000000-0000-0000-0000-00000000000a', 'Cafe', 'cafe');
        insert into public.menu_items (restaurant_id, name, confirmed, also_checked)
          select id, 'Stew', true, true from public.restaurants;
      `);
      await expect(
        db.exec(`update public.menu_items set also_contains = '{beer}'`),
      ).rejects.toThrow();
      await db.exec(`update public.menu_items set also_contains = '{pork}'`);
      const { rows } = await db.query<{ confirmed: boolean }>(
        "select confirmed from public.menu_items",
      );
      expect(rows[0].confirmed).toBe(false);
      const history = await db.query<{ safety: { also_contains: string[] } }>(
        "select safety from public.dish_history order by id desc limit 1",
      );
      expect(history.rows[0].safety.also_contains).toEqual(["pork"]);
    } finally {
      await db.close();
    }
  }, 30000);
});
