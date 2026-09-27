import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  translateDishes: vi.fn(),
  saveTranslations: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/report-error", () => ({ reportError: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  clientKey: () => "ip",
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/db", () => ({
  getRestaurantBySlug: async () => ({ id: "cafe-id" }),
  getConfirmedDishes: async () => [
    { id: "soup", name: "Sopa", description: "", notes: "", source_language: "es" },
    { id: "tea", name: "Té", description: "", notes: "", source_language: "es" },
  ],
}));
vi.mock("@/lib/db/translations", () => ({
  getCachedTranslations: async (_language: string, dishes: { id: string }[]) => ({
    found: { soup: { name: "Soup", description: "", notes: "", section: "", options: [] } },
    missing: dishes.filter((dish) => dish.id !== "soup"),
  }),
  saveTranslations: mocks.saveTranslations,
}));
vi.mock("@/lib/ai/translate", () => ({ translateDishes: mocks.translateDishes }));
import { GET } from "@/app/api/translations/route";

const read = () => GET(new Request("https://carte.test/api/translations?restaurant=cafe&lang=en"));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.translateDishes.mockResolvedValue([
    { id: "tea", name: "Tea", description: "", notes: "", section: "", options: [] },
  ]);
});

it("translates what's missing and saves it", async () => {
  mocks.checkRateLimit.mockResolvedValue(true);
  const { translations } = await (await read()).json();
  expect(Object.keys(translations)).toEqual(["soup", "tea"]);
  expect(mocks.checkRateLimit).toHaveBeenCalledWith("translate-ai:cafe-id:en", 6, 3600000);
  expect(mocks.saveTranslations).toHaveBeenCalledOnce();
});

it("stops paying for a menu's translation after a few tries an hour, and shows what it has", async () => {
  mocks.checkRateLimit.mockImplementation(async (key: string) => !key.startsWith("translate-ai:"));
  const response = await read();
  expect(response.status).toBe(200);
  expect(Object.keys((await response.json()).translations)).toEqual(["soup"]);
  expect(mocks.translateDishes).not.toHaveBeenCalled();
});
