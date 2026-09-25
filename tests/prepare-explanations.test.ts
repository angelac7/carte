import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  explainDish: vi.fn(),
  dishesWithoutInsight: vi.fn(),
  saveInsight: vi.fn(),
  checkRateLimit: vi.fn(),
}));
vi.mock("@/lib/ai/explain", () => ({ explainDish: mocks.explainDish }));
vi.mock("@/lib/db/insights", () => ({
  dishesWithoutInsight: mocks.dishesWithoutInsight,
  saveInsight: mocks.saveInsight,
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
import { prepareExplanations } from "@/lib/prepare-explanations";
import type { MenuItem } from "@/types/menu";

const dish = (id: string, confirmed = true): MenuItem => ({
  id,
  name: id,
  description: "",
  price: "",
  allergens: [],
  dietary_tags: [],
  notes: "",
  confirmed,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.dishesWithoutInsight.mockImplementation(async (dishes: MenuItem[]) => dishes);
  mocks.checkRateLimit.mockResolvedValue(true);
  mocks.explainDish.mockImplementation(async (d: MenuItem) => ({ summary: `About ${d.name}` }));
  mocks.saveInsight.mockResolvedValue(undefined);
});

it("explains only confirmed dishes, in English by default", async () => {
  expect(await prepareExplanations([dish("a"), dish("b", false)], "Cafe")).toBe(1);
  expect(mocks.dishesWithoutInsight).toHaveBeenCalledWith([dish("a")], "en");
  expect(mocks.explainDish).toHaveBeenCalledWith(dish("a"), "English", "Cafe");
  expect(mocks.saveInsight).toHaveBeenCalledWith(dish("a"), "en", { summary: "About a" });
});

it("keeps going when one dish fails, and skips dishes another run is already explaining", async () => {
  mocks.explainDish.mockImplementation(async (d: MenuItem) => {
    if (d.id === "b") throw new Error("AI unavailable");
    return { summary: d.id };
  });
  mocks.checkRateLimit.mockImplementation(async (key: string) => !key.includes(":c:"));
  const written = await prepareExplanations(
    ["a", "b", "c", "d", "e", "f"].map((id) => dish(id)),
    "Cafe",
  );
  expect(written).toBe(4);
  expect(mocks.explainDish).not.toHaveBeenCalledWith(dish("c"), "English", "Cafe");
  expect(mocks.saveInsight).toHaveBeenCalledTimes(4);
});
