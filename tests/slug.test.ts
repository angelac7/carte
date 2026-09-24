import { describe, expect, it } from "vitest";
import { isValidSlug, slugify } from "@/lib/slug";

describe("slugify", () => {
  it("turns a restaurant name into a menu link", () => {
    expect(slugify("Joe's Ramen & Bar!")).toBe("joes-ramen-bar");
  });

  it("removes accents", () => {
    expect(slugify("Café Crème")).toBe("cafe-creme");
  });

  it("returns an empty link for names without Latin letters, so owners choose one", () => {
    expect(slugify("라멘")).toBe("");
  });
});

describe("isValidSlug", () => {
  it("accepts lowercase letters, numbers, and single dashes", () => {
    expect(isValidSlug("joes-ramen-2")).toBe(true);
  });

  it("rejects links that are too short, uppercase, or badly dashed", () => {
    for (const bad of ["ab", "Joes", "joes--ramen", "-joes", "joes-"]) {
      expect(isValidSlug(bad)).toBe(false);
    }
  });
});
