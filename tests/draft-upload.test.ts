import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getOwnerContext: vi.fn(),
  listDishes: vi.fn(),
  addDishes: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  after: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getOwnerContext: mocks.getOwnerContext }));
vi.mock("@/lib/db", () => ({ listDishes: mocks.listDishes, addDishes: mocks.addDishes }));
vi.mock("@/lib/prepare-explanations", () => ({ prepareExplanations: vi.fn() }));
vi.mock("@/lib/storage/dish-photos", () => ({ deleteStoredPhoto: vi.fn() }));
vi.mock("@/lib/db/photos", () => ({ getDishPhoto: vi.fn() }));
import { POST } from "@/app/api/items/route";

const dish = (name: string) => ({
  name,
  description: "",
  price: "",
  likely_allergens: [],
  dietary_tags: [],
});
const save = (body: unknown) =>
  POST(new Request("http://localhost/api/items", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getOwnerContext.mockResolvedValue({ supabase: {}, restaurant: { id: "cafe" } });
  mocks.listDishes.mockResolvedValue([{ name: "Soup" }, { name: "Stew", draft: true }]);
  mocks.addDishes.mockImplementation(async (_s, _r, dishes) => dishes);
});

it("saves a new menu into the draft, skipping only dishes already in the draft", async () => {
  await save({ items: [dish("Soup"), dish("Stew"), dish("Pie")], skipExisting: true, draft: true });
  const [, , added, options] = mocks.addDishes.mock.calls[0];
  expect(added.map((d: { name: string }) => d.name)).toEqual(["Soup", "Pie"]);
  expect(options).toEqual({ draft: true });
});

it("skips dishes already on the menu when saving straight to it", async () => {
  await save({ items: [dish("Soup"), dish("Pie")], skipExisting: true });
  const [, , added, options] = mocks.addDishes.mock.calls[0];
  expect(added.map((d: { name: string }) => d.name)).toEqual(["Pie"]);
  expect(options).toEqual({ draft: false });
});
