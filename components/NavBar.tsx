"use client";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "@/components/OfflineLink";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { NavLink } from "@/lib/owner-nav";

type NavBarProps = {
  homeHref: string;
  links: NavLink[];
  trailing?: ReactNode;
};

/** A sticky header: links with a sliding highlight on larger screens, a menu button on phones. */
export function NavBar({ homeHref, links, trailing }: NavBarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Lift the header off the page once the visitor starts scrolling.
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));
  const isActive = (href: string) => pathname === href;

  const linkClass =
    "eyebrow relative isolate rounded-full px-3.5 py-2 text-muted transition-colors hover:text-ink aria-[current=page]:text-accent";
  const mobileLinkClass =
    "rounded-control px-4 py-3 font-mono text-sm tracking-wider text-muted uppercase transition-[color,box-shadow] hover:text-ink aria-[current=page]:text-accent aria-[current=page]:shadow-pressed-sm";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b bg-paper/85 backdrop-blur transition-[box-shadow,border-color] duration-300 print:hidden",
        scrolled ? "border-transparent shadow-raised-sm" : "border-ink",
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link
          href={homeHref}
          className="font-serif text-[1.75rem] leading-none tracking-tight"
          onClick={() => setOpen(false)}
        >
          Carte
        </Link>

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
                  className="absolute inset-0 -z-10 rounded-full bg-paper shadow-pressed-sm"
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
          className="rounded-full bg-paper p-2.5 shadow-raised-sm transition-shadow active:shadow-pressed-sm md:hidden"
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
              initial={false}
              animate={{ d: open ? "M6 6 L18 18" : "M4 7 L20 7" }}
            />
            <motion.path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              initial={false}
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
            className="overflow-hidden border-t border-ink/10 md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={mobileLinkClass}
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
