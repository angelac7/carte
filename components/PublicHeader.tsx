import { logOut } from "@/app/auth/actions";
import { NavBar } from "@/components/NavBar";
import { PublicTabBar } from "@/components/PublicTabBar";
import { Button, ButtonLink } from "@/components/ui/button";
import { getHeaderAccount, type HeaderAccount } from "@/lib/auth";
import { DINER_LINKS, ownerLinks } from "@/lib/owner-nav";

type PublicHeaderProps = {
  /** Pass the account when the page already has it, to skip looking it up again. */
  account?: HeaderAccount | null;
};

/**
 * The header on every page. Everyone sees the same links; signed-in owners also get their
 * restaurant pages under "My restaurant", plus Log out instead of Log in and Sign up.
 */
export async function PublicHeader({ account }: PublicHeaderProps = {}) {
  const owner = account === undefined ? await getHeaderAccount() : account;
  return (
    <>
      <NavBar
        homeHref="/"
        links={DINER_LINKS}
        ownerMenu={
          owner
            ? { label: "My restaurant", links: ownerLinks(owner.restaurant, owner.admin) }
            : undefined
        }
        trailing={
          owner ? (
            <form action={logOut}>
              <Button type="submit" variant="ghost" size="sm">
                Log out
              </Button>
            </form>
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
