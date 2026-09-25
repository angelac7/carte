export type NavLink = { href: string; label: string };

/** Links everyone sees, signed in or not. */
export const DINER_LINKS: NavLink[] = [
  { href: "/discover", label: "Discover" },
  { href: "/places", label: "Nearby" },
  { href: "/scan", label: "Scan a menu" },
  { href: "/my", label: "My Carte" },
];

/**
 * The extra pages a signed-in owner sees, in one place so the header menu and the dashboard
 * tabs always match. Owners without a restaurant yet get the setup page instead.
 */
export function ownerLinks(
  restaurant: { slug: string; role?: "owner" | "editor" } | null,
  admin: boolean,
): NavLink[] {
  // Editors help with the menu; the map listing and the team are the owner's.
  const owner = restaurant?.role !== "editor";
  const links: NavLink[] = restaurant
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard/upload", label: "Upload" },
        { href: "/dashboard/review", label: "Review dishes" },
        { href: "/dashboard/qr", label: "QR code" },
        { href: "/dashboard/print", label: "Printed menu" },
        { href: "/dashboard/profile", label: "Profile" },
        ...(owner
          ? [
              { href: "/dashboard/claim", label: "Map listing" },
              { href: "/dashboard/team", label: "Team" },
            ]
          : []),
        { href: "/dashboard/account", label: "Account" },
        { href: `/r/${restaurant.slug}`, label: "Diner menu" },
      ]
    : [
        { href: "/dashboard/setup", label: "Set up your restaurant" },
        { href: "/dashboard/account", label: "Account" },
      ];
  if (admin) links.push({ href: "/admin/claims", label: "Review claims" });
  return links;
}
