"use client";
import { logOut } from "@/app/auth/actions";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";

type OwnerHeaderProps = { admin?: boolean; restaurant: { name: string; slug: string } | null };

export function OwnerHeader({ restaurant, admin }: OwnerHeaderProps) {
  const links = restaurant
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard/upload", label: "Upload" },
        { href: "/dashboard/review", label: "Review dishes" },
        { href: "/dashboard/qr", label: "QR code" },
        { href: "/dashboard/profile", label: "Profile" },
        { href: "/dashboard/claim", label: "Map listing" },
        { href: `/r/${restaurant.slug}`, label: "Diner menu" },
      ]
    : [];

  if (admin) links.push({ href: "/admin/claims", label: "Review claims" });

  return (
    <NavBar
      // The logo leads to the public site, which is the same for everyone.
      homeHref="/"
      links={links}
      subtitle={restaurant?.name}
      trailing={
        <form action={logOut}>
          <Button type="submit" variant="ghost" size="sm">
            Log out
          </Button>
        </form>
      }
    />
  );
}
