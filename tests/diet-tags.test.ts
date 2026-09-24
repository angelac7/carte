import { describe, expect, it } from "vitest";
import { AI_SUGGESTED_TAGS, DIETARY_TAGS, OWNER_ONLY_TAGS } from "@/lib/allergens";
import { ExtractedDishSchema } from "@/types/menu";

describe("diet tags", () => {
  it("never lets the AI set owner-only tags like halal or kosher", () => {
    const dish = ExtractedDishSchema.parse({
      name: "Lamb Plate",
      dietary_tags: ["halal", "kosher", "gluten-free", "kid-friendly"],
    });
    expect(dish.dietary_tags).toEqual(["gluten-free"]);
  });

  it("includes every AI-suggested and owner-only tag", () => {
    expect(DIETARY_TAGS).toEqual([...AI_SUGGESTED_TAGS, ...OWNER_ONLY_TAGS]);
  });
});
