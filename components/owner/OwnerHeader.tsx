"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logOut } from "@/app/auth/actions";

type OwnerHeaderProps = { restaurant: { name: string; slug: string } | null };

export function OwnerHeader({ restaurant }: OwnerHeaderProps) {
  const pathname = usePathname();
  const links = restaurant
    ? [
        { href: "/dashboard", label: "Upload menu" },
        { href: "/dashboard/review", label: "Review dishes" },
        { href: "/dashboard/qr", label: "QR code" },
        { href: "/dashboard/profile", label: "Profile" },
        { href: `/r/${restaurant.slug}`, label: "Diner menu" },
      ]
    : [];

  return (
    <header className="border-b border-line bg-card print:hidden">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-baseline gap-3">
          <Link href="/dashboard" className="font-serif text-2xl">
            Carte
          </Link>
          {restaurant && <span className="text-sm text-muted">{restaurant.name}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={pathname === link.href ? "text-ink" : "text-muted hover:text-ink"}
            >
              {link.label}
            </Link>
          ))}
          <form action={logOut}>
            <button type="submit" className="text-muted hover:text-ink">
              Log out
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
