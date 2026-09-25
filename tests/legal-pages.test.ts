import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({})) }));
vi.mock("@/lib/db", () => ({ listListedMenuSlugs: vi.fn(async () => []) }));
import sitemap from "@/app/sitemap";
import { legalContactEmail } from "@/lib/legal";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("privacy and terms", () => {
  it("shows a contact email only once one is set", () => {
    vi.stubEnv("LEGAL_CONTACT_EMAIL", "  ");
    expect(legalContactEmail()).toBeNull();
    vi.stubEnv("LEGAL_CONTACT_EMAIL", " hello@carte.example ");
    expect(legalContactEmail()).toBe("hello@carte.example");
  });

  it("lists both pages for search engines", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls.some((url) => url.endsWith("/privacy"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/terms"))).toBe(true);
  });
});
