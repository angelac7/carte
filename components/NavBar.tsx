"use client";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type NavLink = { href: string; label: string };

type NavBarProps = {
  homeHref: string;
  links: NavLink[];
  subtitle?: string;
  trailing?: ReactNode;
};

/** A sticky header: links with a sliding highlight on larger screens, a menu button on phones. */
export function NavBar({ homeHref, links, subtitle, trailing }: NavBarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => pathname === href;

  const linkClass =
    "relative isolate rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink aria-[current=page]:text-ink";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/85 backdrop-blur print:hidden">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <Link href={homeHref} className="font-serif text-2xl" onClick={() => setOpen(false)}>
            Carte
          </Link>
          {subtitle && (
            <span className="hidden truncate text-sm text-muted sm:inline">{subtitle}</span>
          )}
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={linkClass}
            >
              {isActive(link.href) && (
                <motion.span
                  layoutId="nav-highlight"
                  className="absolute inset-0 -z-10 rounded-md bg-paper"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              {link.label}
            </Link>
          ))}
          {trailing && <div className="ml-2 flex items-center gap-2">{trailing}</div>}
        </div>

        <button
          type="button"
          className="rounded-md p-2 transition-colors hover:bg-paper md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((current) => !current)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <motion.path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{ d: open ? "M6 6 L18 18" : "M4 7 L20 7" }}
            />
            <motion.path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{ d: open ? "M6 18 L18 6" : "M4 17 L20 17" }}
            />
          </svg>
        </button>
      </nav>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-line md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(linkClass, "px-2 py-2.5 text-base aria-[current=page]:bg-paper")}
                >
                  {link.label}
                </Link>
              ))}
              {trailing && <div className="flex flex-wrap gap-2 pt-3">{trailing}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
