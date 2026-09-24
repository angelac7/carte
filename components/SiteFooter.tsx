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

export function SiteFooter() {
  const linkClass = "text-muted transition-colors hover:text-ink";
  return (
    <footer className="border-t border-line bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3">
        <div>
          <p className="font-serif text-3xl">Carte</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Menus with confirmed allergens, translations, and answers for every diner.
          </p>
        </div>
        <nav aria-label="For diners">
          <h2 className="text-sm font-medium">For diners</h2>
          <ul className="mt-3 space-y-2 text-sm">
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
          <h2 className="text-sm font-medium">For restaurants</h2>
          <ul className="mt-3 space-y-2 text-sm">
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
      <p className="mx-auto max-w-6xl px-5 pb-10 text-xs leading-relaxed text-muted">
        Allergen information on Carte menus is confirmed by each restaurant. Kitchens share
        equipment and recipes change, so always tell your server about allergies.
      </p>
    </footer>
  );
}
