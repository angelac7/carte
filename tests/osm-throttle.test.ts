import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/place-cache", () => ({
  readPlaceCache: async () => undefined,
  writePlaceCache: async () => {},
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn() }));
import { checkRateLimit } from "@/lib/rate-limit";
import { getPlace } from "@/lib/places/osm";
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});
it("waits for a shared upstream slot before contacting the map provider", async () => {
  vi.useFakeTimers();
  vi.stubEnv("OSM_CONTACT_EMAIL", "test@example.com");
  const fetch = vi.fn().mockResolvedValue(Response.json({ elements: [] }));
  vi.stubGlobal("fetch", fetch);
  vi.mocked(checkRateLimit).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const pending = getPlace("node-1");
  await vi.advanceTimersByTimeAsync(0);
  expect(fetch).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1100);
  expect(await pending).toBeNull();
  expect(checkRateLimit).toHaveBeenCalledWith("osm:upstream", 1, 1100);
  expect(fetch).toHaveBeenCalledOnce();
});
it("fails within a bounded wait rather than queueing unlimited upstream calls", async () => {
  vi.useFakeTimers();
  vi.mocked(checkRateLimit).mockResolvedValue(false);
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const pending = expect(getPlace("node-2")).rejects.toThrow("busy");
  await vi.advanceTimersByTimeAsync(2200);
  await pending;
  expect(fetch).not.toHaveBeenCalled();
});
