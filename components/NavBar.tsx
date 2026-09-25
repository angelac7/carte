"use client";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "@/components/OfflineLink";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { NavLink } from "@/lib/owner-nav";

type NavBarProps = {
  homeHref: string;
  /** Links everyone sees. */
  links: NavLink[];
  /** Extra pages for signed-in owners, grouped under one menu. */
  ownerMenu?: { label: string; links: NavLink[] };
  trailing?: ReactNode;
};

const linkClass =
  "eyebrow relative isolate rounded-full px-3.5 py-2 text-muted transition-colors hover:text-ink aria-[current=page]:text-accent";
const mobileLinkClass =
  "rounded-control px-4 py-3 font-mono text-sm tracking-wider text-muted uppercase transition-[color,box-shadow] hover:text-ink aria-[current=page]:text-accent aria-[current=page]:shadow-pressed-sm";
const menuLinkClass =
  "block rounded-control px-4 py-2.5 text-sm text-ink transition-[box-shadow,color] hover:text-accent aria-[current=page]:text-accent aria-[current=page]:shadow-pressed-sm";

/**
 * The sticky header on every page. Everyone gets the same links; signed-in owners also get
 * their restaurant pages in one menu. Phones get a menu button with both groups.
 */
export function NavBar({ homeHref, links, ownerMenu, trailing }: NavBarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const ownerRef = useRef<HTMLDivElement>(null);
  // Lift the header off the page once the visitor starts scrolling.
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));
  const isActive = (href: string) => pathname === href;
  const ownerActive = ownerMenu?.links.some((link) => isActive(link.href)) ?? false;

  // Close the owner menu on a click elsewhere or Escape.
  useEffect(() => {
    if (!ownerOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!ownerRef.current?.contains(event.target as Node)) setOwnerOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOwnerOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [ownerOpen]);

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

          {ownerMenu && (
            <div ref={ownerRef} className="relative">
              <button
                type="button"
                aria-expanded={ownerOpen}
                aria-controls="owner-menu"
                onClick={() => setOwnerOpen((current) => !current)}
                className={cn(
                  linkClass,
                  "flex items-center gap-1.5",
                  (ownerActive || ownerOpen) && "text-accent shadow-pressed-sm",
                )}
              >
                {ownerMenu.label}
                <span
                  aria-hidden="true"
                  className={cn("text-[10px] transition-transform", ownerOpen && "rotate-180")}
                >
                  ▼
                </span>
              </button>
              <AnimatePresence>
                {ownerOpen && (
                  <motion.ul
                    id="owner-menu"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute right-0 top-full z-40 mt-3 w-64 rounded-panel bg-paper p-2 shadow-raised-lg"
                  >
                    {ownerMenu.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={isActive(link.href) ? "page" : undefined}
                          onClick={() => setOwnerOpen(false)}
                          className={menuLinkClass}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}

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
            className="max-h-[80svh] overflow-y-auto border-t border-ink/10 md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-3">
              {ownerMenu && <p className="eyebrow px-4 pt-1 pb-1 text-muted/70">Explore</p>}
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
              {ownerMenu && (
                <>
                  <p className="eyebrow mt-3 border-t border-ink/10 px-4 pt-4 pb-1 text-muted/70">
                    {ownerMenu.label}
                  </p>
                  {ownerMenu.links.map((link) => (
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
                </>
              )}
              {trailing && <div className="flex flex-wrap gap-2 pt-3">{trailing}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
