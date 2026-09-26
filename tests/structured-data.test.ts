import { describe, expect, it } from "vitest";
import { DEFAULT_HOURS } from "@/lib/restaurant-profile";
import { jsonLdText, menuStructuredData } from "@/lib/structured-data";

const dishes = [
  {
    name: "Pork Buns",
    description: "Steamed, with hoisin",
    section: "Starters",
    allergens: ["wheat"],
  },
  { name: "Pho", description: "", section: "Soups", allergens: [] },
  { name: "Spring Rolls", description: "Crispy", section: "Starters", allergens: ["shellfish"] },
];

describe("menuStructuredData", () => {
  it("describes the restaurant and groups dishes under their headings", () => {
    const data = menuStructuredData({
      name: "Test Kitchen",
      url: "https://carte.app/r/test",
      cuisine: "Vietnamese",
      phone: "555-0100",
      address: "12 Main St",
      city: "Ithaca",
      priceRange: 2,
      dishes,
    });
    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: "Test Kitchen",
      servesCuisine: "Vietnamese",
      telephone: "555-0100",
      priceRange: "$$",
      address: { "@type": "PostalAddress", streetAddress: "12 Main St", addressLocality: "Ithaca" },
    });
    expect(data.hasMenu.hasMenuSection).toEqual([
      {
        "@type": "MenuSection",
        name: "Starters",
        hasMenuItem: [
          { "@type": "MenuItem", name: "Pork Buns", description: "Steamed, with hoisin" },
          { "@type": "MenuItem", name: "Spring Rolls", description: "Crispy" },
        ],
      },
      {
        "@type": "MenuSection",
        name: "Soups",
        hasMenuItem: [{ "@type": "MenuItem", name: "Pho" }],
      },
    ]);
  });

  it("never includes allergens or diet labels, which only Carte shows with its warnings", () => {
    const text = JSON.stringify(menuStructuredData({ name: "T", url: "u", dishes }));
    expect(text).not.toMatch(/allergen|wheat|shellfish|suitableForDiet/i);
  });

  it("only lists hours the owner saved, keeping late closings as they are", () => {
    const none = menuStructuredData({ name: "T", url: "u", hours: null, dishes: [] });
    expect(none).not.toHaveProperty("openingHoursSpecification");

    const hours = { ...DEFAULT_HOURS, mon: null, fri: { open: "18:00", close: "02:00" } };
    const data = menuStructuredData({ name: "T", url: "u", hours, dishes: [] });
    const days = data.openingHoursSpecification!.map((spec) => spec.dayOfWeek);
    expect(days).not.toContain("https://schema.org/Monday");
    expect(data.openingHoursSpecification).toContainEqual({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "https://schema.org/Friday",
      opens: "18:00",
      closes: "02:00",
    });
  });

  it("leaves out details the owner hasn't filled in", () => {
    const data = menuStructuredData({ name: "T", url: "u", cuisine: " ", phone: "", dishes: [] });
    expect(data).not.toHaveProperty("servesCuisine");
    expect(data).not.toHaveProperty("telephone");
    expect(data).not.toHaveProperty("address");
    expect(data).not.toHaveProperty("priceRange");
  });
});

describe("jsonLdText", () => {
  it("escapes < so a dish name can't close the script tag", () => {
    const text = jsonLdText({ name: "</script><script>alert(1)</script>" });
    expect(text).not.toContain("<");
    expect(JSON.parse(text).name).toBe("</script><script>alert(1)</script>");
  });
});
