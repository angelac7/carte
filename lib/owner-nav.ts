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
export function ownerLinks(restaurant: { slug: string } | null, admin: boolean): NavLink[] {
  const links: NavLink[] = restaurant
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard/upload", label: "Upload" },
        { href: "/dashboard/review", label: "Review dishes" },
        { href: "/dashboard/qr", label: "QR code" },
        { href: "/dashboard/profile", label: "Profile" },
        { href: "/dashboard/claim", label: "Map listing" },
        { href: `/r/${restaurant.slug}`, label: "Diner menu" },
      ]
    : [{ href: "/dashboard/setup", label: "Set up your restaurant" }];
  if (admin) links.push({ href: "/admin/claims", label: "Review claims" });
  return links;
}
