"use client";
import { logOut } from "@/app/auth/actions";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";

type OwnerHeaderProps = { restaurant: { name: string; slug: string } | null };

export function OwnerHeader({ restaurant }: OwnerHeaderProps) {
  const links = restaurant
    ? [
        { href: "/dashboard", label: "Home" },
        { href: "/dashboard/upload", label: "Upload" },
        { href: "/dashboard/review", label: "Review dishes" },
        { href: "/dashboard/qr", label: "QR code" },
        { href: "/dashboard/profile", label: "Profile" },
        { href: "/dashboard/claim", label: "Map listing" },
        { href: `/r/${restaurant.slug}`, label: "Diner menu" },
      ]
    : [];

  return (
    <NavBar
      homeHref="/dashboard"
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
