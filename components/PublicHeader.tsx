import { logOut } from "@/app/auth/actions";
import { NavBar } from "@/components/NavBar";
import { PublicTabBar } from "@/components/PublicTabBar";
import { Button, ButtonLink } from "@/components/ui/button";
import { isSignedIn } from "@/lib/auth";
import { OWNER_STRINGS } from "@/lib/i18n/owner-strings";
import type { LanguageCode } from "@/lib/languages";
import { dinerLinks } from "@/lib/owner-nav";

type PublicHeaderProps = {
  /** Pass it when the page already knows, to skip checking the session again. */
  signedIn?: boolean;
  /** The owner's dashboard language, on dashboard pages. Other pages are in English. */
  language?: LanguageCode;
};

/**
 * The header on every page. Everyone sees the same links; signed-in owners get Log out and
 * Dashboard where signed-out visitors get Log in and Sign up.
 */
export async function PublicHeader({ signedIn, language = "en" }: PublicHeaderProps = {}) {
  const owner = signedIn ?? (await isSignedIn());
  const t = OWNER_STRINGS[language].header;
  return (
    <>
      <NavBar
        homeHref="/"
        links={dinerLinks(t)}
        menuLabels={{ open: t.openMenu, close: t.closeMenu }}
        trailing={
          owner ? (
            <>
              <form action={logOut}>
                <Button type="submit" variant="ghost" size="sm">
                  {t.logOut}
                </Button>
              </form>
              <ButtonLink href="/dashboard" size="sm" shine>
                {t.dashboard}
              </ButtonLink>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                {t.logIn}
              </ButtonLink>
              <ButtonLink href="/signup" size="sm" shine>
                {t.signUp}
              </ButtonLink>
            </>
          )
        }
      />
      <PublicTabBar labels={t} />
    </>
  );
}
