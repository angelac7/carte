import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getOwnerContext: vi.fn(), reorderDishes: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  after: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getOwnerContext: mocks.getOwnerContext }));
vi.mock("@/lib/db", () => ({ reorderDishes: mocks.reorderDishes }));
vi.mock("@/lib/prepare-explanations", () => ({ prepareExplanations: vi.fn() }));
vi.mock("@/lib/storage/dish-photos", () => ({ deleteStoredPhoto: vi.fn() }));
vi.mock("@/lib/db/photos", () => ({ getDishPhoto: vi.fn() }));
import { PATCH } from "@/app/api/items/route";
import { sourceHash, translationHash } from "@/lib/source-hash";
import { ExtractedDishSchema } from "@/types/menu";

const a = "3f0c9a4e-2b1d-4c8e-9f6a-7d5b3c2a1e0f";
const b = "9a1b2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d";
const patch = (body: unknown) =>
  PATCH(new Request("http://localhost/api/items", { method: "PATCH", body: JSON.stringify(body) }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getOwnerContext.mockResolvedValue({ supabase: {}, restaurant: { id: "restaurant" } });
  mocks.reorderDishes.mockResolvedValue([{ id: b, revision: 4, sort_order: 1 }]);
});

describe("menu order", () => {
  it("saves the owner's order and returns the new versions", async () => {
    const response = await patch({ order: [b, a] });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: b, revision: 4, sort_order: 1 }]);
    expect(mocks.reorderDishes).toHaveBeenCalledWith({}, "restaurant", [b, a]);
  });

  it("needs a signed-in owner and a list of dish ids", async () => {
    expect((await patch({ order: ["not-a-dish"] })).status).toBe(400);
    mocks.getOwnerContext.mockResolvedValueOnce(null);
    expect((await patch({ order: [a] })).status).toBe(401);
    expect(mocks.reorderDishes).not.toHaveBeenCalled();
  });

  it("keeps old translations for dishes without a section", () => {
    const dish = { name: "Soup", description: "", notes: "", source_language: "en" };
    expect(translationHash({ ...dish, section: "" })).toBe(sourceHash(dish));
    expect(translationHash({ ...dish, section: "Starters" })).not.toBe(sourceHash(dish));
  });

  it("reads each dish's menu heading from the menu photo", () => {
    const read = ExtractedDishSchema.parse({ name: "Soup", section: "  Starters " });
    expect(read.section).toBe("Starters");
  });
});
