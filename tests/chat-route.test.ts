import { beforeEach, expect, it, vi } from "vitest";
import type { MenuItem } from "@/types/menu";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({})) }));
vi.mock("@/lib/db", () => ({
  getRestaurantBySlug: vi.fn(async () => ({ id: "restaurant" })),
  getConfirmedDishes: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: () => true, clientKey: () => "test" }));
vi.mock("@/lib/ai/chat", () => ({
  streamMenuAnswer: vi.fn(async function* () {
    yield "Try the salad.";
  }),
}));
import { POST } from "@/app/api/chat/route";
import { getConfirmedDishes } from "@/lib/db";
import { streamMenuAnswer } from "@/lib/ai/chat";

beforeEach(() => vi.clearAllMocks());
it("only sends dishes meeting every diner filter to chat", async () => {
  const base: MenuItem = {
    id: "salad",
    name: "Salad",
    description: "",
    price: "",
    notes: "",
    confirmed: true,
    allergens: [],
    dietary_tags: ["vegan"],
  };
  vi.mocked(getConfirmedDishes).mockResolvedValue([
    base,
    { ...base, id: "nuts", allergens: ["peanuts"] },
    { ...base, id: "meat", dietary_tags: [] },
  ]);
  const response = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        restaurant: "test-menu",
        language: "en",
        avoid: ["peanuts"],
        onlyTags: ["vegan"],
        messages: [{ role: "user", content: "What should I order?" }],
      }),
    }),
  );
  expect(response.status).toBe(200);
  await response.text();
  expect(vi.mocked(streamMenuAnswer).mock.calls[0][0]).toEqual([base]);
});
it("rejects invalid allergy filters", async () => {
  const response = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        restaurant: "test-menu",
        language: "en",
        avoid: ["invalid"],
        messages: [{ role: "user", content: "Hi" }],
      }),
    }),
  );
  expect(response.status).toBe(400);
  expect(streamMenuAnswer).not.toHaveBeenCalled();
});
