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
import { ALLERGENS, allergensChecked, uncheckedAllergens } from "@/lib/allergens";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { LANGUAGES } from "@/lib/languages";
import { filterDishes } from "@/lib/menu-filters";
import type { MenuItem } from "@/types/menu";

const dish: MenuItem = {
  id: "3f0c9a4e-2b1d-4c8e-9f6a-7d5b3c2a1e0f",
  revision: 2,
  name: "Salad",
  description: "",
  price: "",
  allergens: [],
  dietary_tags: [],
  notes: "",
  confirmed: true,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getOwnerContext.mockResolvedValue({ supabase: {}, restaurant: { id: "r", name: "Cafe" } });
  mocks.updateDish.mockImplementation(async (_s, _r, saved) => saved);
});

describe("the 14 allergens", () => {
  it("names every allergen in every language", () => {
    expect(ALLERGENS).toHaveLength(14);
    for (const { code } of LANGUAGES) {
      for (const allergen of ALLERGENS)
        expect(DINER_STRINGS[code].allergens[allergen]).toBeTruthy();
    }
  });

  it("hides dishes never checked for a newer allergen the diner avoids", () => {
    const older = { ...dish, allergen_list: 1 };
    const checked = { ...dish, id: "b", allergen_list: 2 };
    expect(uncheckedAllergens(1, ["mustard", "milk"])).toEqual(["mustard"]);
    expect(uncheckedAllergens(2, ["mustard"])).toEqual([]);
    expect(filterDishes([older, checked], { avoid: ["mustard"], onlyTags: [] })).toEqual([checked]);
    expect(filterDishes([older, checked], { avoid: ["milk"], onlyTags: [] })).toHaveLength(2);
    expect(allergensChecked(undefined)).toBe(9);
    expect(allergensChecked(2)).toBe(14);
  });

  it("marks a dish checked for all 14 only when the owner presses Confirm", async () => {
    const put = (body: unknown) =>
      PUT(new Request("http://localhost/api/items", { method: "PUT", body: JSON.stringify(body) }));
    await put({ ...dish, special: true, allergen_list: 2 });
    expect(mocks.updateDish.mock.calls[0][2].allergen_list).toBeUndefined();
    await put({ ...dish, confirm: true });
    expect(mocks.updateDish.mock.calls[1][2].allergen_list).toBe(2);
    await put({ ...dish, confirmed: false, confirm: true });
    expect(mocks.updateDish.mock.calls[2][2].allergen_list).toBeUndefined();
  });
});
