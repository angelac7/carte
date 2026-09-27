import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getOwnerContext: vi.fn(), restoreBackup: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ getOwnerContext: mocks.getOwnerContext }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: async () => true }));
vi.mock("@/lib/report-error", () => ({ reportError: vi.fn() }));
vi.mock("@/lib/db/backup", () => ({
  restoreBackup: mocks.restoreBackup,
  DraftExistsError: class extends Error {},
}));
import { POST } from "@/app/api/backup/route";

const restore = (body: string) =>
  POST(new Request("http://localhost/api/backup", { method: "POST", body }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getOwnerContext.mockResolvedValue({
    supabase: {},
    user: { id: "user" },
    restaurant: { id: "cafe" },
  });
});

it("turns down a file that isn't JSON, or isn't a backup, without restoring anything", async () => {
  for (const body of [
    "not json",
    "{",
    "",
    JSON.stringify({ backup: { dishes: [] }, profile: false }),
  ]) {
    const response = await restore(body);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("That isn't a Carte backup, or it's damaged.");
  }
  expect(mocks.restoreBackup).not.toHaveBeenCalled();
});

it("needs a signed-in owner", async () => {
  mocks.getOwnerContext.mockResolvedValue(null);
  expect((await restore("{}")).status).toBe(401);
});
