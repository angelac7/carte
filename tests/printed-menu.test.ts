// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { PrintableMenu } from "@/components/owner/PrintableMenu";
import type { MenuItem } from "@/types/menu";

afterEach(cleanup);

const dish = (overrides: Partial<MenuItem>): MenuItem => ({
  id: "d",
  name: "Dish",
  description: "",
  price: "$9",
  allergens: [],
  dietary_tags: [],
  notes: "",
  confirmed: true,
  allergen_list: 2,
  ...overrides,
});

const menu = [
  dish({ id: "soup", name: "Tomato Soup", section: "Starters", allergens: ["milk"] }),
  dish({ id: "tea", name: "Iced Tea", section: "Drinks", special: true }),
  dish({
    id: "cake",
    name: "Carrot Cake",
    section: "Desserts",
    allergens: ["eggs", "wheat"],
    allergen_list: 1,
  }),
];

function print(language: "en" | "es", translations = {}) {
  render(
    createElement(PrintableMenu, {
      restaurantName: "Cafe",
      dishes: menu,
      language,
      translations,
      qrSrc: "data:image/svg+xml;utf8,",
      menuUrl: "https://carte.example/r/cafe",
      printedOn: "September 25, 2026",
    }),
  );
}

describe("printed menu", () => {
  it("prints specials first, then each section, with every dish's allergens", () => {
    print("en");
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(["Specials", "Starters", "Desserts"]);
    expect(screen.getByText("Contains: milk")).toBeTruthy();
    expect(screen.getByText("Contains: eggs and wheat")).toBeTruthy();
    expect(screen.getByText("None of the 14 major allergens listed")).toBeTruthy();
  });

  it("uses fixed allergen translations, and saved dish translations with the original beside them", () => {
    print("es", {
      soup: {
        name: "Sopa de tomate",
        description: "",
        notes: "",
        section: "Entrantes",
        options: [],
      },
    });
    expect(screen.getByText("Contiene: leche")).toBeTruthy();
    expect(screen.getByText("Sopa de tomate")).toBeTruthy();
    expect(screen.getByText("Tomato Soup")).toBeTruthy();
    // Not translated yet, so it prints in the original language.
    expect(screen.getByText("Carrot Cake")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Entrantes" })).toBeTruthy();
  });
});
