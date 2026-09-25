"use client";
import { usePathname } from "next/navigation";
import Link from "@/components/OfflineLink";
import type { NavLink } from "@/lib/owner-nav";

/** The owner's restaurant pages as a row of tabs under the header, on dashboard pages. */
export function OwnerTabs({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="My restaurant" className="border-b border-ink/10 print:hidden">
      {/* Scrolls sideways on narrow phones instead of wrapping onto several rows. */}
      <div className="mx-auto max-w-6xl overflow-x-auto px-5">
        <ul className="flex w-max gap-1 py-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className="eyebrow block rounded-full px-3.5 py-2.5 whitespace-nowrap text-muted transition-[color,box-shadow] hover:text-ink aria-[current=page]:text-accent aria-[current=page]:shadow-pressed-sm"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
