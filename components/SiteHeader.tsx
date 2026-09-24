"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const OWNER_LINKS = [
  { href: "/", label: "Upload menu" },
  { href: "/review", label: "Review dishes" },
  { href: "/qr", label: "QR code" },
];

/** Owners see their tools; diners on the menu page see only the Carte name. */
export function SiteHeader() {
  const pathname = usePathname();
  const isDinerPage = pathname.startsWith("/menu");

  return (
    <header className="border-b border-line bg-card print:hidden">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <Link href={isDinerPage ? "/menu" : "/"} className="font-serif text-2xl">
          Carte
        </Link>
        {!isDinerPage && (
          <div className="flex gap-5 text-sm">
            {OWNER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={pathname === link.href ? "text-ink" : "text-muted hover:text-ink"}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
