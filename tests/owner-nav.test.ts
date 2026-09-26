import { describe, expect, it } from "vitest";
import { DINER_LINKS, ownerLinks } from "@/lib/owner-nav";

describe("site navigation", () => {
  it("gives owners every restaurant page, ending with their diner menu", () => {
    const labels = ownerLinks({ slug: "maru" }, false).map((link) => link.label);
    expect(labels).toEqual([
      "Dashboard",
      "Upload",
      "Review dishes",
      "Allergen history",
      "QR code",
      "Printed menu",
      "Profile",
      "Map listing",
      "Team",
      "Account",
      "Diner menu",
    ]);
    expect(ownerLinks({ slug: "maru" }, false).at(-1)?.href).toBe("/r/maru");
  });

  it("leaves the map listing and team to the owner", () => {
    const labels = ownerLinks({ slug: "maru", role: "editor" }, false).map((link) => link.label);
    expect(labels).not.toContain("Map listing");
    expect(labels).not.toContain("Team");
    expect(labels).toContain("Review dishes");
  });

  it("sends owners without a restaurant to setup, and adds admin tools for admins", () => {
    expect(ownerLinks(null, false)).toEqual([
      { href: "/dashboard/setup", label: "Set up your restaurant" },
      { href: "/dashboard/account", label: "Account" },
    ]);
    expect(ownerLinks(null, true).at(-1)).toEqual({ href: "/admin", label: "Admin" });
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
