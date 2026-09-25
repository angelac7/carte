import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ listListedMenuSlugs: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({})) }));
vi.mock("@/lib/db", () => ({ listListedMenuSlugs: mocks.listListedMenuSlugs }));
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { siteUrl } from "@/lib/site-url";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://carte.example/");
  mocks.listListedMenuSlugs.mockResolvedValue(["maru", "cafe"]);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("link previews and search engines", () => {
  it("uses the public site address without a trailing slash", () => {
    expect(siteUrl()).toBe("https://carte.example");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "carte-kohl.vercel.app");
    expect(siteUrl()).toBe("https://carte-kohl.vercel.app");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("lists public pages and every menu shown on Discover", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain("https://carte.example/discover");
    expect(urls).toContain("https://carte.example/r/maru");
    expect(urls).toContain("https://carte.example/r/cafe");
    expect(urls.some((url) => url.includes("/dashboard"))).toBe(false);
  });

  it("still lists public pages when menus can't be loaded", async () => {
    mocks.listListedMenuSlugs.mockRejectedValueOnce(new Error("offline"));
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain("https://carte.example");
    expect(urls.some((url) => url.includes("/r/"))).toBe(false);
  });

  it("keeps owner pages and the API out of search results", () => {
    const rules = robots();
    expect(rules.sitemap).toBe("https://carte.example/sitemap.xml");
    const disallow = (Array.isArray(rules.rules) ? rules.rules[0] : rules.rules).disallow;
    expect(disallow).toEqual(expect.arrayContaining(["/dashboard", "/admin", "/api/"]));
  });
});
