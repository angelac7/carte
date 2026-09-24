import { describe, expect, it } from "vitest";
import { MenuStreamEventSchema, ScanStreamEventSchema } from "@/types/menu-stream";

describe("menu stream events", () => {
  it("cleans up a dish the same way as a full menu", () => {
    const event = MenuStreamEventSchema.parse({
      type: "dish",
      dish: {
        name: "Ramyun",
        price: 18,
        likely_allergens: ["wheat", "gluten"],
        dietary_tags: null,
      },
    });
    expect(event).toEqual({
      type: "dish",
      dish: {
        name: "Ramyun",
        description: "",
        price: "18",
        likely_allergens: ["wheat"],
        dietary_tags: [],
      },
    });
  });

  it("accepts done and error events and rejects unknown ones", () => {
    expect(MenuStreamEventSchema.parse({ type: "done" })).toEqual({ type: "done" });
    expect(MenuStreamEventSchema.safeParse({ type: "error", message: "No dishes" }).success).toBe(
      true,
    );
    expect(MenuStreamEventSchema.safeParse({ type: "progress" }).success).toBe(false);
  });
});

describe("scan stream events", () => {
  it("keeps only known allergens on scanned dishes", () => {
    const event = ScanStreamEventSchema.parse({
      type: "dish",
      dish: { original: "冷面", name: "Cold noodles", allergens: ["wheat", "msg"] },
    });
    expect(event).toEqual({
      type: "dish",
      dish: { original: "冷面", name: "Cold noodles", description: "", allergens: ["wheat"] },
    });
  });

  it("carries the menu's language", () => {
    expect(ScanStreamEventSchema.parse({ type: "language", menuLanguage: "ja" })).toEqual({
      type: "language",
      menuLanguage: "ja",
    });
  });
});

describe("scan language line", () => {
  it("reads the language code and ignores dish lines", async () => {
    const { MenuLanguageLineSchema } = await import("@/types/camera");
    expect(MenuLanguageLineSchema.parse({ menuLanguage: "zh-Hans" })).toEqual({
      menuLanguage: "zh-Hans",
    });
    expect(MenuLanguageLineSchema.parse({ menuLanguage: "" })).toEqual({ menuLanguage: "" });
    expect(
      MenuLanguageLineSchema.safeParse({ original: "冷面", name: "Cold noodles" }).success,
    ).toBe(false);
  });
});
