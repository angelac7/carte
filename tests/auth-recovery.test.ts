import { beforeEach, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth }) }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ origin: "https://carte.test" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: async () => true,
  clientKeyFromHeaders: () => "test",
}));
import { logIn, signUp, requestPasswordReset, resetPassword } from "@/app/auth/actions";
import { GET } from "@/app/auth/callback/route";
const next = "/dashboard/claim?place=node%2F123";
function form() {
  const data = new FormData();
  data.set("email", "owner@example.com");
  data.set("password", "password123");
  data.set("confirmPassword", "password123");
  data.set("next", next);
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  auth.signInWithPassword.mockResolvedValue({ error: null });
  auth.signUp.mockResolvedValue({ error: null, data: { session: {} } });
  auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  auth.getUser.mockResolvedValue({ data: { user: { id: "owner" } } });
  auth.updateUser.mockResolvedValue({ error: null });
});
it("preserves the claim destination through login and signup", async () => {
  await expect(logIn({}, form())).rejects.toThrow(`redirect:${next}`);
  await expect(signUp({}, form())).rejects.toThrow(
    `redirect:/dashboard/setup?next=${encodeURIComponent(next)}`,
  );
  expect(auth.signUp.mock.calls[0][0].options.emailRedirectTo).toContain(encodeURIComponent(next));
});
it("sends owners home after login, and new owners to setup, when no page was requested", async () => {
  const data = form();
  data.delete("next");
  await expect(logIn({}, data)).rejects.toThrow(/^redirect:\/$/);
  await expect(signUp({}, data)).rejects.toThrow(
    `redirect:/dashboard/setup?next=${encodeURIComponent("/dashboard")}`,
  );
});
it("sends a recovery callback and updates the authenticated owner's password", async () => {
  expect(await requestPasswordReset({}, form())).toHaveProperty("message");
  expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("owner@example.com", {
    redirectTo: expect.stringContaining("/auth/callback?next=/reset-password"),
  });
  await expect(resetPassword({}, form())).rejects.toThrow("redirect:/dashboard");
  expect(auth.updateUser).toHaveBeenCalledWith({ password: "password123" });
});
it("rejects expired sessions and mismatched passwords", async () => {
  auth.getUser.mockResolvedValue({ data: { user: null } });
  expect(await resetPassword({}, form())).toHaveProperty("error");
  const data = form();
  data.set("confirmPassword", "different");
  expect(await resetPassword({}, data)).toHaveProperty("error");
  expect(auth.updateUser).not.toHaveBeenCalled();
});
it("routes recovery callback failures back to recovery, and successful claims to their destination", async () => {
  auth.exchangeCodeForSession
    .mockResolvedValueOnce({ error: new Error("expired") })
    .mockResolvedValueOnce({ error: null });
  const failed = await GET(
    new Request("https://carte.test/auth/callback?code=old&next=/reset-password"),
  );
  expect(failed.headers.get("location")).toBe("https://carte.test/forgot-password?error=expired");
  const success = await GET(
    new Request(`https://carte.test/auth/callback?code=new&next=${encodeURIComponent(next)}`),
  );
  expect(success.headers.get("location")).toBe(`https://carte.test${next}`);
});
