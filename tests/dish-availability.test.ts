import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getOwnerContext: vi.fn(),
  setSoldOut: vi.fn(),
  getRestaurantBySlug: vi.fn(),
  getConfirmedDishes: vi.fn(),
  recommendDishes: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ getOwnerContext: mocks.getOwnerContext }));
vi.mock("@/lib/db", () => ({
  setSoldOut: mocks.setSoldOut,
  getRestaurantBySlug: mocks.getRestaurantBySlug,
  getConfirmedDishes: mocks.getConfirmedDishes,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({})) }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: async () => true, clientKey: () => "ip" }));
vi.mock("@/lib/ai/recommend", () => ({ recommendDishes: mocks.recommendDishes }));
import { POST as recommend } from "@/app/api/recommend/route";
import { POST as soldOut } from "@/app/api/items/sold-out/route";
import { dishAvailability, inServingWindow, restaurantClock } from "@/lib/availability";
import type { MenuItem } from "@/types/menu";
import { HUNGER_LEVELS } from "@/types/recommend";

const dishId = "3f0c9a4e-2b1d-4c8e-9f6a-7d5b3c2a1e0f";
const dish = (overrides: Partial<MenuItem>): MenuItem => ({
  id: "soup",
  name: "Soup",
  description: "",
  price: "",
  allergens: [],
  dietary_tags: [],
  notes: "",
  confirmed: true,
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getOwnerContext.mockResolvedValue({
    supabase: {},
    restaurant: { id: "restaurant", timezone: "America/Los_Angeles" },
  });
  mocks.setSoldOut.mockImplementation(async (_s, _r, id, day) => ({ id, sold_out_on: day }));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("dish availability", () => {
  it("uses the restaurant's own clock, with the service day turning over at 4 AM", () => {
    // 1:30 AM on September 26 in Los Angeles still belongs to the 25th's service.
    const lateNight = new Date("2026-09-26T08:30:00Z");
    expect(restaurantClock("America/Los_Angeles", lateNight)).toEqual({
      date: "2026-09-25",
      time: "01:30",
    });
    expect(restaurantClock("Asia/Seoul", lateNight)).toEqual({ date: "2026-09-26", time: "17:30" });
    expect(restaurantClock("Not/AZone", lateNight)).toBeNull();
  });

  it("handles serving windows, including ones that run past midnight", () => {
    expect(inServingWindow("12:00", "11:00", "15:00")).toBe(true);
    expect(inServingWindow("15:00", "11:00", "15:00")).toBe(false);
    expect(inServingWindow("23:30", "22:00", "02:00")).toBe(true);
    expect(inServingWindow("01:00", "22:00", "02:00")).toBe(true);
    expect(inServingWindow("12:00", "22:00", "02:00")).toBe(false);
    expect(inServingWindow("12:00", "", "")).toBe(true);
  });

  it("marks dishes sold out only on the day they sold out", () => {
    const clock = { date: "2026-09-25", time: "19:00" };
    expect(dishAvailability(dish({ sold_out_on: "2026-09-25" }), clock)).toBe("sold-out");
    expect(dishAvailability(dish({ sold_out_on: "2026-09-24" }), clock)).toBe("available");
    const lunch = dish({ available_from: "11:00:00", available_until: "15:00:00" });
    expect(dishAvailability(lunch, clock)).toBe("not-now");
    expect(dishAvailability(lunch, { ...clock, time: "12:15" })).toBe("available");
    expect(dishAvailability(lunch, null)).toBe("available");
  });

  it("sells out a dish for the restaurant's current service day, and brings it back", async () => {
    vi.useFakeTimers({ now: new Date("2026-09-26T08:30:00Z"), toFake: ["Date"] });
    const post = (body: unknown) =>
      soldOut(new Request("http://localhost", { method: "POST", body: JSON.stringify(body) }));
    const response = await post({ id: dishId, soldOut: true });
    expect(await response.json()).toEqual({ id: dishId, sold_out_on: "2026-09-25" });
    await post({ id: dishId, soldOut: false });
    expect(mocks.setSoldOut).toHaveBeenLastCalledWith({}, "restaurant", dishId, null);
    expect((await post({ id: "nope", soldOut: true })).status).toBe(400);
    mocks.getOwnerContext.mockResolvedValueOnce(null);
    expect((await post({ id: dishId, soldOut: true })).status).toBe(401);
  });

  it("never suggests a dish that can't be ordered right now", async () => {
    vi.useFakeTimers({ now: new Date("2026-09-25T19:00:00Z"), toFake: ["Date"] });
    mocks.getRestaurantBySlug.mockResolvedValue({ id: "r", name: "Cafe", timezone: "UTC" });
    mocks.getConfirmedDishes.mockResolvedValue([
      dish({ id: "soup" }),
      dish({ id: "gone", sold_out_on: "2026-09-25" }),
      dish({ id: "lunch", available_from: "11:00", available_until: "15:00" }),
    ]);
    mocks.recommendDishes.mockResolvedValue({ picks: [], note: "" });
    await recommend(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          restaurant: "cafe",
          language: "en",
          avoid: [],
          onlyTags: [],
          hunger: HUNGER_LEVELS[0],
          spice: 1,
          people: 2,
          budget: null,
        }),
      }),
    );
    const offered = mocks.recommendDishes.mock.calls[0][0] as MenuItem[];
    expect(offered.map((d) => d.id)).toEqual(["soup"]);
  });
});
