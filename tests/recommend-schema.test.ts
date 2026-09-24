import { describe, expect, it } from "vitest";
import { RecommendationSchema, RecommendRequestSchema } from "@/types/recommend";

const valid = {
  restaurant: "joes-ramen",
  language: "en",
  avoid: ["peanuts"],
  onlyTags: ["halal"],
  hunger: "hungry",
  spice: 1,
  people: 2,
  budget: null,
};

describe("RecommendRequestSchema", () => {
  it("accepts a valid request, including owner-only diet tags", () => {
    expect(RecommendRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects out-of-range values", () => {
    expect(RecommendRequestSchema.safeParse({ ...valid, spice: 5 }).success).toBe(false);
    expect(RecommendRequestSchema.safeParse({ ...valid, people: 0 }).success).toBe(false);
  });
});

describe("RecommendationSchema", () => {
  it("keeps at most five picks and fills in a missing note", () => {
    const picks = Array.from({ length: 7 }, (_, i) => ({ id: `${i}`, reason: "Good" }));
    const result = RecommendationSchema.parse({ picks });
    expect(result.picks).toHaveLength(5);
    expect(result.note).toBe("");
  });
});
