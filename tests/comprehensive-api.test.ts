import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: async () => true, clientKey: () => "test" }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/read-image-upload", () => ({
  readImageUpload: async () => ({ ok: true, base64: "image", mediaType: "image/jpeg" }),
}));
vi.mock("@/lib/db", () => ({
  getRestaurantBySlug: async () => ({ id: "cafe", name: "Cafe" }),
  getConfirmedDishes: vi.fn(),
}));
vi.mock("@/lib/ai/photo-match", () => ({ matchDishPhoto: vi.fn() }));
vi.mock("@/lib/ai/client", () => ({
  createMessage: vi.fn(),
  parseJsonReply: (reply: unknown) => reply,
}));
import { POST } from "@/app/api/photo-match/route";
import { getConfirmedDishes } from "@/lib/db";
import { matchDishPhoto } from "@/lib/ai/photo-match";
import { createMessage } from "@/lib/ai/client";
import { translateDishes } from "@/lib/ai/translate";
import type { MenuItem } from "@/types/menu";
const dish: MenuItem = {
  id: "dish",
  name: "Soup",
  description: "Cream soup",
  price: "$10",
  allergens: ["milk"],
  dietary_tags: [],
  notes: "Shared fryer",
  confirmed: true,
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getConfirmedDishes).mockResolvedValue([dish]);
  vi.mocked(matchDishPhoto).mockResolvedValue([]);
});
function request(avoid: string[]) {
  const form = new FormData();
  form.set("restaurant", "cafe");
  form.set("lang", "en");
  for (const value of avoid) form.append("avoid", value);
  return new Request("https://carte.test/api/photo-match", { method: "POST", body: form });
}
it("never sends excluded dishes to the photo matcher", async () => {
  expect(await (await POST(request(["milk"]))).json()).toEqual({ matches: [] });
  expect(matchDishPhoto).not.toHaveBeenCalled();
  await POST(request([]));
  expect(matchDishPhoto).toHaveBeenCalledOnce();
  expect(vi.mocked(matchDishPhoto).mock.calls[0][2]).toEqual([dish]);
});
it("rejects unknown photo-match filters", async () => {
  expect((await POST(request(["invalid"]))).status).toBe(400);
  expect(matchDishPhoto).not.toHaveBeenCalled();
});
it("rejects missing dish translations and missing kitchen warnings", async () => {
  vi.mocked(createMessage).mockResolvedValueOnce({ dishes: [] } as never);
  await expect(translateDishes([dish], "Spanish")).rejects.toThrow("incomplete");
  vi.mocked(createMessage).mockResolvedValueOnce({
    dishes: [{ id: "dish", name: "Sopa", description: "Sopa de crema", notes: "" }],
  } as never);
  await expect(translateDishes([dish], "Spanish")).rejects.toThrow("incomplete");
});
it("keeps only requested translations and preserves their order", async () => {
  const translated = {
    id: "dish",
    name: "Sopa",
    description: "Sopa de crema",
    notes: "Freidora compartida",
  };
  vi.mocked(createMessage).mockResolvedValueOnce({
    dishes: [{ ...translated, id: "unknown" }, translated],
  } as never);
  // A dish without a section gets an empty translated section.
  expect(await translateDishes([dish], "Spanish")).toEqual([
    { ...translated, section: "", options: [] },
  ]);
});
