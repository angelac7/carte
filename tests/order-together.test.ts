import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getRestaurantBySlug: vi.fn(),
  createSharedOrder: vi.fn(),
  getSharedOrder: vi.fn(),
  setSharedLine: vi.fn(),
  checkRateLimit: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({})) }));
vi.mock("@/lib/db", () => ({ getRestaurantBySlug: mocks.getRestaurantBySlug }));
vi.mock("@/lib/db/shared-orders", () => ({
  createSharedOrder: mocks.createSharedOrder,
  getSharedOrder: mocks.getSharedOrder,
  setSharedLine: mocks.setSharedLine,
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  clientKey: () => "ip",
}));
import { GET, POST, PUT } from "@/app/api/table/route";

const dish = "3f0c9a4e-2b1d-4c8e-9f6a-7d5b3c2a1e0f";
const code = "abcdefgh23";
const json = (method: string, body: unknown) =>
  new Request("http://localhost/api/table", { method, body: JSON.stringify(body) });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.checkRateLimit.mockResolvedValue(true);
  mocks.getRestaurantBySlug.mockResolvedValue({ id: "r" });
  mocks.createSharedOrder.mockResolvedValue({ code, lines: { [dish]: 2 } });
  mocks.getSharedOrder.mockResolvedValue({ restaurantId: "r", lines: { [dish]: 2 } });
  mocks.setSharedLine.mockResolvedValue({ [dish]: 3 });
});

describe("order together", () => {
  it("starts a shared order from this phone's order", async () => {
    const response = await POST(json("POST", { restaurant: "cafe", order: { [dish]: 2 } }));
    expect(await response.json()).toEqual({ code, lines: { [dish]: 2 } });
    expect(mocks.createSharedOrder).toHaveBeenCalledWith("r", { [dish]: 2 });
    expect((await POST(json("POST", { restaurant: "cafe", order: { junk: 1 } }))).status).toBe(400);
    mocks.checkRateLimit.mockResolvedValueOnce(false);
    expect((await POST(json("POST", { restaurant: "cafe", order: {} }))).status).toBe(429);
  });

  it("reads the table's order only for the restaurant it belongs to", async () => {
    const read = (restaurant: string) =>
      GET(new Request(`http://localhost/api/table?code=${code}&restaurant=${restaurant}`));
    expect(await (await read("cafe")).json()).toEqual({ lines: { [dish]: 2 } });
    mocks.getRestaurantBySlug.mockResolvedValueOnce({ id: "somewhere-else" });
    expect((await read("other")).status).toBe(404);
    mocks.getSharedOrder.mockResolvedValueOnce(null);
    expect((await read("cafe")).status).toBe(404);
  });

  it("changes one line, and says when the order has ended", async () => {
    const put = (body: unknown) => PUT(json("PUT", body));
    expect(await (await put({ code, line: `${dish}|1|0`, quantity: 3 })).json()).toEqual({
      lines: { [dish]: 3 },
    });
    expect((await put({ code: "NOPE", line: dish, quantity: 1 })).status).toBe(400);
    expect((await put({ code, line: dish, quantity: 99 })).status).toBe(400);
    mocks.setSharedLine.mockResolvedValueOnce(null);
    expect((await put({ code, line: dish, quantity: 1 })).status).toBe(404);
    mocks.setSharedLine.mockRejectedValueOnce(new Error("unknown dish"));
    expect((await put({ code, line: dish, quantity: 1 })).status).toBe(400);
  });
});
