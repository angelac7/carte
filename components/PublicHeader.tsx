import { NavBar } from "@/components/NavBar";
import { ButtonLink } from "@/components/ui/button";

const LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/places", label: "Nearby" },
  { href: "/scan", label: "Scan a menu" },
  { href: "/my", label: "My Carte" },
];

export function PublicHeader() {
  return (
    <NavBar
      homeHref="/"
      links={LINKS}
      trailing={
        <>
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" size="sm" shine>
            Sign up
          </ButtonLink>
        </>
      }
    />
  );
}
