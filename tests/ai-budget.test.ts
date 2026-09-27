import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ consumeAiCall: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/report-error", () => ({ reportError: vi.fn() }));
vi.mock("@/lib/db/ai-usage", () => ({ consumeAiCall: mocks.consumeAiCall }));
import { aiLimits, allowAiCall } from "@/lib/ai-budget";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.consumeAiCall.mockResolvedValue(true);
});
afterEach(() => vi.unstubAllEnvs());

it("counts each call against a restaurant's and all of Carte's daily limits", async () => {
  expect(await allowAiCall("chat", "cafe-id")).toBe(true);
  expect(mocks.consumeAiCall).toHaveBeenCalledWith("cafe-id", "chat", 500, 3000);
  mocks.consumeAiCall.mockResolvedValue(false);
  expect(await allowAiCall("scan", null)).toBe(false);
});

it("takes its limits from Vercel's settings, ignoring anything that isn't a whole number", () => {
  vi.stubEnv("AI_DAILY_LIMIT_PER_RESTAURANT", "50");
  vi.stubEnv("AI_DAILY_LIMIT", "lots");
  expect(aiLimits()).toEqual({ perRestaurant: 50, total: 3000 });
});

it("doesn't call the AI when the count can't be checked", async () => {
  mocks.consumeAiCall.mockRejectedValue(new Error("database down"));
  expect(await allowAiCall("chat", "cafe-id")).toBe(false);
});
