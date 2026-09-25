import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const rows = vi.hoisted(() => ({ data: [] as unknown[] }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    const query = {
      select: () => query,
      in: () => query,
      eq: () => Promise.resolve({ data: rows.data, error: null }),
    };
    return { from: () => query };
  },
}));
import { currentInsights, dishesWithoutInsight, getCachedSummaries } from "@/lib/db/insights";
import { summaryKey } from "@/lib/dish-summaries";
import { sourceHash } from "@/lib/source-hash";
import { DishInsightSchema } from "@/types/insight";
import type { MenuItem } from "@/types/menu";

function dish(id: string, overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id,
    revision: 1,
    name: "Toro ssam bap",
    description: "Fatty tuna, tobiko, rice",
    price: "$24",
    allergens: ["fish"],
    dietary_tags: [],
    notes: "",
    confirmed: true,
    ...overrides,
  };
}

function row(forDish: MenuItem, insight: Record<string, unknown>, format = 2) {
  return {
    menu_item_id: forDish.id,
    source_hash: sourceHash(forDish),
    insight: { ...insight, format },
  };
}

describe("dish explanations", () => {
  beforeEach(() => {
    rows.data = [];
  });

  it("reads explanations saved before the name meaning was added", () => {
    const glossary = Array.from({ length: 10 }, (_, i) => ({ term: `t${i}`, meaning: "m" }));
    const insight = DishInsightSchema.parse({ summary: "A rice bowl.", glossary });
    expect(insight.nameMeaning).toBe("");
    expect(insight.glossary).toHaveLength(8);
  });

  it("ignores an explanation written before the dish was edited", () => {
    const current = dish("a");
    const edited = dish("b", { description: "Now with salmon" });
    const found = currentInsights(
      [row(current, { summary: "Tuna over rice." }), row(dish("b"), { summary: "Old text." })],
      [current, edited],
    );
    expect(found.get("a")?.summary).toBe("Tuna over rice.");
    expect(found.has("b")).toBe(false);
  });

  it("rewrites explanations saved in an older format", async () => {
    const old = dish("a");
    rows.data = [row(old, { summary: "Tuna over rice." }, 1)];
    expect(await dishesWithoutInsight([old], "en")).toEqual([old]);
    expect(await getCachedSummaries([old], "en")).toEqual({});
  });

  it("keys menu summaries by dish version and skips empty ones", async () => {
    const withSummary = dish("a", { revision: 3 });
    const blank = dish("b");
    rows.data = [row(withSummary, { summary: "Tuna over rice." }), row(blank, { summary: "" })];
    const summaries = await getCachedSummaries([withSummary, blank], "en");
    expect(summaries).toEqual({ [summaryKey(withSummary)]: "Tuna over rice." });
    expect(summaryKey(withSummary)).toBe("a:3");
  });

  it("lists only dishes that still need an explanation", async () => {
    const done = dish("a");
    const todo = dish("b");
    rows.data = [row(done, { summary: "Tuna over rice." })];
    expect(await dishesWithoutInsight([done, todo], "en")).toEqual([todo]);
    expect(await getCachedSummaries([], "en")).toEqual({});
  });
});
