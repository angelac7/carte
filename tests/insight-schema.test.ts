import { describe, expect, it } from "vitest";
import { DishInsightSchema } from "@/types/insight";

describe("DishInsightSchema", () => {
  it("clamps meters to 0 to 3 and falls back to a single portion", () => {
    const insight = DishInsightSchema.parse({ spice: 7, richness: "2", portion: "huge" });
    expect(insight.spice).toBe(3);
    expect(insight.richness).toBe(2);
    expect(insight.portion).toBe("single");
  });

  it("drops empty glossary entries and fills in missing lists", () => {
    const insight = DishInsightSchema.parse({
      glossary: [
        { term: "Tobiko", meaning: "Flying fish roe" },
        { term: "", meaning: "No term" },
      ],
    });
    expect(insight.glossary).toEqual([{ term: "Tobiko", meaning: "Flying fish roe" }]);
    expect(insight.pairings).toEqual([]);
    expect(insight.askKitchen).toEqual([]);
  });
});
