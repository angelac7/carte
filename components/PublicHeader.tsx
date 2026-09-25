import { logOut } from "@/app/auth/actions";
import { NavBar } from "@/components/NavBar";
import { PublicTabBar } from "@/components/PublicTabBar";
import { Button, ButtonLink } from "@/components/ui/button";
import { isSignedIn } from "@/lib/auth";
import { DINER_LINKS } from "@/lib/owner-nav";

type PublicHeaderProps = {
  /** Pass it when the page already knows, to skip checking the session again. */
  signedIn?: boolean;
};

/**
 * The header on every page. Everyone sees the same links; signed-in owners get Log out and
 * Dashboard where signed-out visitors get Log in and Sign up.
 */
export async function PublicHeader({ signedIn }: PublicHeaderProps = {}) {
  const owner = signedIn ?? (await isSignedIn());
  return (
    <>
      <NavBar
        homeHref="/"
        links={DINER_LINKS}
        trailing={
          owner ? (
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
