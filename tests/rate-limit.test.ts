import { afterEach, expect, it, vi } from "vitest";
const consume = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/rate-limits", () => ({ consumeRateLimit: consume }));
import { checkRateLimit } from "@/lib/rate-limit";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it("uses shared counters without storing the caller's address", async () => {
  vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret");
  consume.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  expect(await checkRateLimit("scan:192.0.2.1", 3, 1000)).toBe(true);
  expect(await checkRateLimit("scan:192.0.2.1", 3, 1000)).toBe(false);
  expect(consume.mock.calls[0]).toEqual([expect.stringMatching(/^[a-f0-9]{64}$/), 3, 1000]);
  expect(consume.mock.calls[0][0]).toBe(consume.mock.calls[1][0]);
});
it("fails closed when storage is unavailable", async () => {
  vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret");
  vi.spyOn(console, "error").mockImplementation(() => {});
  consume.mockRejectedValue(new Error("offline"));
  expect(await checkRateLimit("scan:ip", 3, 1000)).toBe(false);
});
