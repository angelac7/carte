import { logOut } from "@/app/auth/actions";
import { NavBar } from "@/components/NavBar";
import { PublicTabBar } from "@/components/PublicTabBar";
import { Button, ButtonLink } from "@/components/ui/button";
import { hasSessionCookie } from "@/lib/auth";

const LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/places", label: "Nearby" },
  { href: "/scan", label: "Scan a menu" },
  { href: "/my", label: "My Carte" },
];

/** The same site for everyone; signed-in owners also get a way back to their dashboard. */
export async function PublicHeader() {
  const signedIn = await hasSessionCookie();
  return (
    <>
      <NavBar
        homeHref="/"
        links={LINKS}
        trailing={
          signedIn ? (
            <>
              <form action={logOut}>
                <Button type="submit" variant="ghost" size="sm">
                  Log out
                </Button>
              </form>
              <ButtonLink href="/dashboard" size="sm" shine>
                Dashboard
              </ButtonLink>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup" size="sm" shine>
                Sign up
              </ButtonLink>
            </>
          )
        }
      />
      <PublicTabBar />
    </>
  );
}
