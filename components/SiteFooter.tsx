import Link from "next/link";

const DINER_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/places", label: "Restaurants nearby" },
  { href: "/scan", label: "Scan a menu" },
  { href: "/my", label: "My Carte" },
];

const OWNER_LINKS = [
  { href: "/signup", label: "Put your menu on Carte" },
  { href: "/login", label: "Owner log in" },
];

/** An inverted ink footer with the wordmark set as a graphic. */
export function SiteFooter() {
  const linkClass =
    "text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline";
  return (
    <footer className="texture-ink text-white">
      <div className="mx-auto max-w-6xl px-5 pt-16 pb-10">
        <div className="grid gap-10 border-b border-white/15 pb-12 sm:grid-cols-3">
          <div>
            <p className="eyebrow text-white/50">Carte</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
              Menus with confirmed allergens, translations, and answers for every diner.
            </p>
          </div>
          <nav aria-label="For diners">
            <h2 className="eyebrow text-white/50">For diners</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {DINER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="For restaurants">
            <h2 className="eyebrow text-white/50">For restaurants</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {OWNER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p
          aria-hidden="true"
          className="mt-8 font-serif text-[clamp(5rem,22vw,16rem)] leading-[0.8] tracking-tighter text-white/95 italic"
        >
          Carte
        </p>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-white/60">
          Allergen information on Carte menus is confirmed by each restaurant. Kitchens share
          equipment and recipes change, so always tell your server about allergies.
        </p>
      </div>
    </footer>
  );
}
