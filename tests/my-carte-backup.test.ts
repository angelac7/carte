import { expect, it } from "vitest";
import {
  EMPTY_MY_CARTE,
  exportMyCarte,
  importMyCarte,
  mergeMyCarte,
  toggleSavedDish,
} from "@/lib/my-carte";
const dish = {
  dishId: "dish",
  name: "Soup",
  description: "",
  price: "$3",
  restaurantName: "Cafe",
  restaurantSlug: "cafe",
  cuisine: "",
};
it("round-trips a portable backup with diary and challenge data", () => {
  const state = {
    ...toggleSavedDish(EMPTY_MY_CARTE, dish, 123),
    menuSizes: { cafe: 5 },
    diary: [{ ...dish, rating: 4, note: "Good", triedAt: 123 }],
  };
  expect(importMyCarte(exportMyCarte(state))).toEqual(state);
});
it("rejects malformed, future, duplicate and unsafe-path backups without modifying data", () => {
  const state = toggleSavedDish(EMPTY_MY_CARTE, dish, 123);
  const file = JSON.parse(exportMyCarte(state));
  for (const data of [
    { ...file, version: 2 },
    { ...file, data: { ...file.data, diary: [{}] } },
    { ...file, data: { ...file.data, dishes: [file.data.dishes[0], file.data.dishes[0]] } },
    {
      ...file,
      data: {
        ...file.data,
        dishes: [{ ...file.data.dishes[0], restaurantSlug: "../../dashboard" }],
      },
    },
  ])
    expect(() => importMyCarte(JSON.stringify(data))).toThrow();
  expect(state.dishes).toHaveLength(1);
});
it("keeps existing entries during merge and refuses capacity overflow", () => {
  const state = toggleSavedDish(EMPTY_MY_CARTE, dish, 123);
  const incoming = toggleSavedDish(EMPTY_MY_CARTE, { ...dish, name: "Old name" }, 100);
  expect(mergeMyCarte(state, incoming).dishes[0].name).toBe("Soup");
  const full = {
    ...state,
    dishes: Array.from({ length: 200 }, (_, i) => ({ ...state.dishes[0], dishId: `other-${i}` })),
  };
  expect(() => mergeMyCarte(full, incoming)).toThrow();
});
