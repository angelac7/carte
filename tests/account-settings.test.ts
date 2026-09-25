import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: { updateUser: vi.fn(), signOut: vi.fn() },
  passwordMatches: vi.fn(),
  deleteAccount: vi.fn(),
  checkRateLimit: vi.fn(),
  listMyRestaurants: vi.fn(),
  storage: { list: vi.fn(), remove: vi.fn() },
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("@/lib/auth", () => ({
  requireUser: async () => ({
    supabase: { auth: mocks.auth },
    user: { id: "owner", email: "owner@example.com" },
  }),
}));
vi.mock("@/lib/account", () => ({
  passwordMatches: mocks.passwordMatches,
  deleteAccount: mocks.deleteAccount,
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/lib/db", () => ({ listMyRestaurants: mocks.listMyRestaurants }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ storage: { from: () => mocks.storage } }),
}));
import {
  changeEmailAction,
  changePasswordAction,
  deleteAccountAction,
} from "@/app/dashboard/account/actions";
import { deleteAllRestaurantPhotos } from "@/lib/storage/dish-photos";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.passwordMatches.mockResolvedValue(true);
  mocks.checkRateLimit.mockResolvedValue(true);
  mocks.auth.updateUser.mockResolvedValue({ error: null });
  mocks.auth.signOut.mockResolvedValue({ error: null });
  mocks.listMyRestaurants.mockResolvedValue([
    { id: "restaurant", role: "owner" },
    { id: "second-location", role: "owner" },
    { id: "someone-elses", role: "editor" },
  ]);
});

describe("account settings", () => {
  it("changes nothing without the right current password, and limits guesses", async () => {
    mocks.passwordMatches.mockResolvedValueOnce(false);
    const change = form({ newPassword: "new-secret-1", confirmPassword: "new-secret-1" });
    expect(await changePasswordAction({}, change)).toEqual({
      error: "Your current password isn't right.",
    });
    mocks.checkRateLimit.mockResolvedValueOnce(false);
    expect((await changePasswordAction({}, change)).error).toMatch(/Too many attempts/);
    expect(mocks.auth.updateUser).not.toHaveBeenCalled();
  });

  it("sends an email change for confirmation, back to the account page", async () => {
    expect((await changeEmailAction({}, form({ email: "nope" }))).error).toMatch(/valid email/);
    expect(
      (await changeEmailAction({}, form({ email: "OWNER@example.com", currentPassword: "x" })))
        .error,
    ).toMatch(/already your email/);
    const result = await changeEmailAction(
      {},
      form({ email: "new@example.com", currentPassword: "old-secret" }),
    );
    expect(result.message).toMatch(/new@example.com/);
    expect(mocks.passwordMatches).toHaveBeenCalledWith("owner@example.com", "old-secret");
    expect(mocks.auth.updateUser).toHaveBeenCalledWith(
      { email: "new@example.com" },
      { emailRedirectTo: expect.stringContaining("/auth/callback?next=/dashboard/account") },
    );
  });

  it("changes the password only when both new entries match", async () => {
    expect(
      (await changePasswordAction({}, form({ newPassword: "abcdefgh", confirmPassword: "x" })))
        .error,
    ).toMatch(/don't match/);
    const done = await changePasswordAction(
      {},
      form({ newPassword: "abcdefgh", confirmPassword: "abcdefgh", currentPassword: "old" }),
    );
    expect(done.message).toMatch(/changed/);
    expect(mocks.auth.updateUser).toHaveBeenCalledWith({ password: "abcdefgh" });
  });

  it("deletes the account and the restaurants it owns only after typing DELETE", async () => {
    expect((await deleteAccountAction({}, form({ confirm: "delete" }))).error).toMatch(/DELETE/);
    expect(mocks.passwordMatches).not.toHaveBeenCalled();
    await expect(
      deleteAccountAction({}, form({ confirm: "DELETE", currentPassword: "old" })),
    ).rejects.toThrow("redirect:/goodbye");
    // Places the owner only helps edit belong to someone else and aren't deleted.
    expect(mocks.deleteAccount).toHaveBeenCalledWith("owner", ["restaurant", "second-location"]);
    expect(mocks.auth.signOut).toHaveBeenCalled();
  });

  it("removes every photo in the restaurant's folder, page by page", async () => {
    mocks.storage.list
      .mockResolvedValueOnce({ data: [{ name: "a.jpg" }, { name: "b.png" }], error: null })
      .mockResolvedValueOnce({ data: [{ name: "c.webp" }], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    mocks.storage.remove.mockResolvedValue({ error: null });
    await deleteAllRestaurantPhotos("restaurant");
    expect(mocks.storage.remove).toHaveBeenNthCalledWith(1, [
      "restaurant/a.jpg",
      "restaurant/b.png",
    ]);
    expect(mocks.storage.remove).toHaveBeenNthCalledWith(2, ["restaurant/c.webp"]);
  });
});
