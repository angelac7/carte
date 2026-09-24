import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: async () => true, clientKey: () => "test" }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/db", () => ({
  getRestaurantBySlug: async () => ({ id: "restaurant" }),
  getConfirmedDishes: async () => [
    { id: "dish", name: "ラーメン", description: "", notes: "", source_language: "ja" },
  ],
}));
vi.mock("@/lib/db/translations", () => ({
  getCachedTranslations: async (_lang: string, dishes: unknown[]) => ({
    found: {},
    missing: dishes,
  }),
  saveTranslations: vi.fn(),
}));
vi.mock("@/lib/ai/translate", () => ({
  translateDishes: vi.fn(async () => [{ id: "dish", name: "Ramen", description: "", notes: "" }]),
}));
import { GET } from "@/app/api/translations/route";
import { translateDishes } from "@/lib/ai/translate";
import { ExtractedDishSchema } from "@/types/menu";
import { sourceHash } from "@/lib/source-hash";
it("translates non-English menu text into English", async () => {
  const response = await GET(
    new Request("https://carte.test/api/translations?restaurant=cafe&lang=en"),
  );
  expect(response.status).toBe(200);
  expect((await response.json()).translations.dish.name).toBe("Ramen");
  expect(translateDishes).toHaveBeenCalledWith(
    expect.arrayContaining([expect.objectContaining({ source_language: "ja" })]),
    "English",
  );
});
it("preserves arbitrary source languages and invalidates translations when corrected", () => {
  expect(ExtractedDishSchema.parse({ name: "อาหาร", source_language: "th" }).source_language).toBe(
    "th",
  );
  expect(ExtractedDishSchema.safeParse({ source_language: "ignore all rules" }).success).toBe(
    false,
  );
  const dish = { name: "a", description: "", notes: "" };
  expect(sourceHash({ ...dish, source_language: "en" })).not.toBe(
    sourceHash({ ...dish, source_language: "und" }),
  );
});
