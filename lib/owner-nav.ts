import { en } from "@/lib/i18n/owner/en";
import type { OwnerStrings } from "@/lib/i18n/owner-strings";

export type NavLink = { href: string; label: string };

/** Links everyone sees, signed in or not. */
export function dinerLinks(labels: OwnerStrings["header"] = en.header): NavLink[] {
  return [
    { href: "/discover", label: labels.discover },
    { href: "/places", label: labels.nearby },
    { href: "/scan", label: labels.scanMenu },
    { href: "/my", label: labels.myCarte },
  ];
}

export const DINER_LINKS: NavLink[] = dinerLinks();

/**
 * The extra pages a signed-in owner sees, in one place so the header menu and the dashboard
 * tabs always match. Owners without a restaurant yet get the setup page instead.
 */
export function ownerLinks(
  restaurant: { slug: string; role?: "owner" | "editor" } | null,
  admin: boolean,
  labels: OwnerStrings["nav"] = en.nav,
): NavLink[] {
  // Editors help with the menu; the map listing and the team are the owner's.
  const owner = restaurant?.role !== "editor";
  const links: NavLink[] = restaurant
    ? [
        { href: "/dashboard", label: labels.dashboard },
        { href: "/dashboard/upload", label: labels.upload },
        { href: "/dashboard/review", label: labels.review },
        { href: "/dashboard/menus", label: labels.menus },
        { href: "/dashboard/history", label: labels.history },
        { href: "/dashboard/translations", label: labels.translations },
        { href: "/dashboard/qr", label: labels.qr },
        { href: "/dashboard/print", label: labels.print },
        { href: "/dashboard/allergen-chart", label: labels.chart },
        { href: "/dashboard/profile", label: labels.profile },
        ...(owner
          ? [
              { href: "/dashboard/claim", label: labels.claim },
              { href: "/dashboard/team", label: labels.team },
            ]
          : []),
        { href: "/dashboard/account", label: labels.account },
        { href: `/r/${restaurant.slug}`, label: labels.dinerMenu },
      ]
    : [
        { href: "/dashboard/setup", label: labels.setup },
        { href: "/dashboard/account", label: labels.account },
      ];
  if (admin) links.push({ href: "/admin", label: labels.admin });
  return links;
}
