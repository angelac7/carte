import { describe, expect, it } from "vitest";
import {
  computeChallenges,
  EMPTY_MY_CARTE,
  parseMyCarte,
  recordMenuSize,
  removeDiaryEntry,
  saveDiaryEntry,
  similarDishes,
  toggleSavedDish,
  type DishRef,
} from "@/lib/my-carte";
import { TasteRequestSchema } from "@/types/taste";

const dish = (id: string, overrides: Partial<DishRef> = {}): DishRef => ({
  dishId: id,
  name: `Dish ${id}`,
  description: "",
  price: "10",
  restaurantName: "Joe's",
  restaurantSlug: "joes",
  cuisine: "Korean",
  ...overrides,
});

describe("saved dishes", () => {
  it("toggles a dish on and off", () => {
    const saved = toggleSavedDish(EMPTY_MY_CARTE, dish("a"), 1);
    expect(saved.dishes.map((d) => d.dishId)).toEqual(["a"]);
    expect(toggleSavedDish(saved, dish("a"), 2).dishes).toEqual([]);
  });

  it("ignores garbled storage", () => {
    expect(parseMyCarte("not json")).toEqual(EMPTY_MY_CARTE);
    expect(parseMyCarte(null)).toEqual(EMPTY_MY_CARTE);
  });
});

describe("food diary", () => {
  it("replaces an entry for the same dish, keeping when it was first tried", () => {
    let state = saveDiaryEntry(EMPTY_MY_CARTE, dish("a"), 3, "ok", 100);
    state = saveDiaryEntry(state, dish("a"), 5, "  great  ", 200);
    expect(state.diary).toHaveLength(1);
    expect(state.diary[0]).toMatchObject({ rating: 5, note: "great", triedAt: 100 });
    expect(removeDiaryEntry(state, "a").diary).toEqual([]);
  });
});

describe("challenges", () => {
  const now = new Date(2026, 8, 15);
  const at = (day: number) => new Date(2026, 8, day).getTime();

  it("tracks first bite, regular, and explorer", () => {
    let state = EMPTY_MY_CARTE;
    for (const id of ["a", "b", "c", "d", "e"])
      state = saveDiaryEntry(state, dish(id), 4, "", at(10));
    state = saveDiaryEntry(state, dish("f", { restaurantSlug: "other" }), 4, "", at(10));
    const byId = Object.fromEntries(computeChallenges(state, now).map((c) => [c.id, c]));
    expect(byId["first-bite"].done).toBe(true);
    expect(byId.regular.done).toBe(true);
    expect(byId.explorer).toMatchObject({ progress: 2, goal: 3, done: false });
  });

  it("finishes Menu master when every dish on a known menu is tried", () => {
    let state = recordMenuSize(EMPTY_MY_CARTE, "joes", 2);
    state = saveDiaryEntry(state, dish("a"), 4, "", at(10));
    state = saveDiaryEntry(state, dish("b"), 4, "", at(11));
    const master = computeChallenges(state, now).find((c) => c.id === "menu-master");
    expect(master).toMatchObject({ progress: 2, goal: 2, done: true });
  });
});

describe("similarDishes", () => {
  it("suggests dishes that share words with liked dishes, skipping known ones", () => {
    const liked = [{ dishId: "x", name: "Spicy Pork Ramyun", description: "Pork broth" }];
    const candidates = [
      { id: "1", name: "Family Ramyun", description: "Pork broth, scallion" },
      { id: "2", name: "Tuna Salad", description: "Fennel, avocado" },
      { id: "x", name: "Spicy Pork Ramyun", description: "Pork broth" },
    ];
    expect(similarDishes(liked, candidates, new Set(["x"])).map((d) => d.id)).toEqual(["1"]);
  });
});

describe("TasteRequestSchema", () => {
  it("needs at least three rated dishes", () => {
    const rated = { name: "Ramyun", rating: 5, note: "", cuisine: "Korean", restaurant: "Joe's" };
    expect(
      TasteRequestSchema.safeParse({ language: "en", dishes: [rated, rated], saved: [] }).success,
    ).toBe(false);
    expect(
      TasteRequestSchema.safeParse({ language: "en", dishes: [rated, rated, rated], saved: [] })
        .success,
    ).toBe(true);
  });
});
