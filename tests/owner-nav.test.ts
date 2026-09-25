import { describe, expect, it } from "vitest";
import { DINER_LINKS, ownerLinks } from "@/lib/owner-nav";

describe("site navigation", () => {
  it("gives owners every restaurant page, ending with their diner menu", () => {
    const labels = ownerLinks({ slug: "maru" }, false).map((link) => link.label);
    expect(labels).toEqual([
      "Dashboard",
      "Upload",
      "Review dishes",
      "QR code",
      "Profile",
      "Map listing",
      "Diner menu",
    ]);
    expect(ownerLinks({ slug: "maru" }, false).at(-1)?.href).toBe("/r/maru");
  });

  it("sends owners without a restaurant to setup, and adds claim review for admins", () => {
    expect(ownerLinks(null, false)).toEqual([
      { href: "/dashboard/setup", label: "Set up your restaurant" },
    ]);
    expect(ownerLinks(null, true).at(-1)).toEqual({
      href: "/admin/claims",
      label: "Review claims",
    });
  });

  it("keeps the diner pages the same for everyone", () => {
    expect(DINER_LINKS.map((link) => link.label)).toEqual([
      "Discover",
      "Nearby",
      "Scan a menu",
      "My Carte",
    ]);
  });
});
