import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getRestaurantBySlug: vi.fn(),
  getConfirmedDish: vi.fn(),
  addDishReport: vi.fn(),
  checkRateLimit: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({})) }));
vi.mock("@/lib/db", () => ({
  getRestaurantBySlug: mocks.getRestaurantBySlug,
  getConfirmedDish: mocks.getConfirmedDish,
}));
vi.mock("@/lib/db/reports", () => ({ addDishReport: mocks.addDishReport }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  clientKey: () => "ip",
}));
import { POST } from "@/app/api/report/route";
import { timeAgo } from "@/lib/time-ago";
import { ReportRequestSchema } from "@/types/report";

const dishId = "3f0c9a4e-2b1d-4c8e-9f6a-7d5b3c2a1e0f";

function report(body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/report", { method: "POST", body: JSON.stringify(body) }),
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.checkRateLimit.mockResolvedValue(true);
  mocks.getRestaurantBySlug.mockResolvedValue({ id: "restaurant" });
  mocks.getConfirmedDish.mockResolvedValue({ id: dishId, name: "Toro ssam bap" });
});

describe("dish reports", () => {
  it("accepts only known report kinds and short messages", () => {
    const valid = { restaurant: "cart", dish: dishId, kind: "allergens", message: "  Has egg  " };
    expect(ReportRequestSchema.parse(valid).message).toBe("Has egg");
    expect(ReportRequestSchema.parse({ ...valid, message: undefined }).message).toBe("");
    expect(ReportRequestSchema.safeParse({ ...valid, kind: "rude" }).success).toBe(false);
    expect(ReportRequestSchema.safeParse({ ...valid, message: "x".repeat(501) }).success).toBe(
      false,
    );
  });

  it("saves a report about a confirmed dish, keeping the dish's name", async () => {
    const response = await report({ restaurant: "cart", dish: dishId, kind: "price" });
    expect(response.status).toBe(200);
    expect(mocks.addDishReport).toHaveBeenCalledWith(
      {},
      {
        restaurantId: "restaurant",
        dishId,
        dishName: "Toro ssam bap",
        kind: "price",
        message: "",
      },
    );
  });

  it("refuses unknown dishes, bad input, and too many reports", async () => {
    mocks.getConfirmedDish.mockResolvedValueOnce(null);
    expect((await report({ restaurant: "cart", dish: dishId, kind: "other" })).status).toBe(404);
    expect((await report({ restaurant: "Bad Slug!", dish: dishId, kind: "other" })).status).toBe(
      400,
    );
    mocks.checkRateLimit.mockResolvedValueOnce(false);
    expect((await report({ restaurant: "cart", dish: dishId, kind: "other" })).status).toBe(429);
    expect(mocks.addDishReport).not.toHaveBeenCalled();
  });

  it("says how long ago a report came in", () => {
    const now = new Date("2026-09-25T12:00:00Z");
    expect(timeAgo(new Date("2026-09-25T11:59:30Z"), now)).toBe("just now");
    expect(timeAgo(new Date("2026-09-25T11:55:00Z"), now)).toBe("5 minutes ago");
    expect(timeAgo(new Date("2026-09-25T09:00:00Z"), now)).toBe("3 hours ago");
    expect(timeAgo(new Date("2026-09-24T12:00:00Z"), now)).toBe("yesterday");
  });
});
