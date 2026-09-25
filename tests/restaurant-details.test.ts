import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getOwnerContext: vi.fn(),
  requireRestaurant: vi.fn(),
  getRestaurantImages: vi.fn(),
  setRestaurantImage: vi.fn(),
  storeRestaurantImage: vi.fn(),
  deleteStoredPhoto: vi.fn(),
  updateRestaurantProfile: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  getOwnerContext: mocks.getOwnerContext,
  requireRestaurant: mocks.requireRestaurant,
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: async () => true }));
vi.mock("@/lib/db/restaurant-images", () => ({
  getRestaurantImages: mocks.getRestaurantImages,
  setRestaurantImage: mocks.setRestaurantImage,
}));
vi.mock("@/lib/storage/dish-photos", () => ({
  storeRestaurantImage: mocks.storeRestaurantImage,
  deleteStoredPhoto: mocks.deleteStoredPhoto,
}));
vi.mock("@/lib/db/profile", () => ({ updateRestaurantProfile: mocks.updateRestaurantProfile }));
import { saveProfileAction } from "@/app/dashboard/profile/actions";
import { DELETE, POST } from "@/app/api/restaurant-image/route";
import { DEFAULT_PROFILE, ProfileSchema, withWebScheme, WEEKDAYS } from "@/lib/restaurant-profile";

const OLD = "https://x.supabase.co/storage/v1/object/public/dish-photos/r/restaurant-logo-1.jpg";
const NEW = "https://x.supabase.co/storage/v1/object/public/dish-photos/r/restaurant-logo-2.jpg";

function imageForm(kind: string) {
  const form = new FormData();
  form.set("kind", kind);
  form.set("image", new File([new Uint8Array([1, 2, 3])], "logo.png", { type: "image/png" }));
  return new Request("http://localhost/api/restaurant-image", { method: "POST", body: form });
}

function profileForm(fields: Record<string, string>) {
  const form = new FormData();
  form.set("revision", "3");
  form.set("name", "Cafe");
  form.set("timezone", DEFAULT_PROFILE.timezone);
  for (const day of WEEKDAYS) {
    form.set(`${day}-open`, "11:00");
    form.set(`${day}-close`, "21:00");
  }
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return form;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  const owner = { supabase: {}, user: { id: "u" }, restaurant: { id: "r" } };
  mocks.getOwnerContext.mockResolvedValue(owner);
  mocks.requireRestaurant.mockResolvedValue(owner);
  mocks.getRestaurantImages.mockResolvedValue({ logo_url: OLD, cover_url: null });
  mocks.storeRestaurantImage.mockResolvedValue(NEW);
  mocks.setRestaurantImage.mockResolvedValue(undefined);
  mocks.deleteStoredPhoto.mockResolvedValue(undefined);
  mocks.updateRestaurantProfile.mockResolvedValue(4);
});

describe("restaurant details", () => {
  it("accepts web addresses typed with or without https://", () => {
    expect(withWebScheme("example.com")).toBe("https://example.com");
    expect(withWebScheme(" http://example.com ")).toBe("http://example.com");
    expect(withWebScheme("")).toBe("");
    const profile = { ...DEFAULT_PROFILE, name: "Cafe" };
    expect(ProfileSchema.safeParse({ ...profile, website: "https://cafe.example" }).success).toBe(
      true,
    );
    expect(ProfileSchema.safeParse({ ...profile, website: "javascript:alert(1)" }).success).toBe(
      false,
    );
    expect(ProfileSchema.safeParse({ ...profile, price_range: 5 }).success).toBe(false);
  });

  it("saves contact details and price range, and explains a bad link", async () => {
    const saved = await saveProfileAction(
      {},
      profileForm({ phone: "607-555-0123", website: "cafe.example", price_range: "2" }),
    );
    expect(saved.saved).toBe(true);
    expect(mocks.updateRestaurantProfile.mock.calls[0][2]).toMatchObject({
      phone: "607-555-0123",
      website: "https://cafe.example",
      price_range: 2,
    });
    const bad = await saveProfileAction({}, profileForm({ reservation_url: "not a link" }));
    expect(bad.error).toMatch(/reservation link/);
  });

  it("replaces the logo and deletes the old file", async () => {
    const response = await POST(imageForm("logo"));
    expect(await response.json()).toEqual({ url: NEW });
    expect(mocks.setRestaurantImage).toHaveBeenCalledWith({}, "r", "logo", NEW);
    expect(mocks.deleteStoredPhoto).toHaveBeenCalledWith(OLD, "r");
  });

  it("cleans up a new file if it can't be saved to the restaurant", async () => {
    mocks.setRestaurantImage.mockRejectedValueOnce(new Error("constraint"));
    expect((await POST(imageForm("logo"))).status).toBe(502);
    expect(mocks.deleteStoredPhoto).toHaveBeenCalledWith(NEW, "r");
    expect(mocks.deleteStoredPhoto).not.toHaveBeenCalledWith(OLD, "r");
  });

  it("needs a signed-in owner and a known image kind", async () => {
    expect((await POST(imageForm("banner"))).status).toBe(400);
    mocks.getOwnerContext.mockResolvedValueOnce(null);
    expect((await POST(imageForm("logo"))).status).toBe(401);
    const remove = await DELETE(
      new Request("http://localhost", { method: "DELETE", body: JSON.stringify({ kind: "logo" }) }),
    );
    expect(remove.status).toBe(200);
    expect(mocks.setRestaurantImage).toHaveBeenCalledWith({}, "r", "logo", null);
  });
});
