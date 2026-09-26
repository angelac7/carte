import { OwnerTabs } from "@/components/owner/OwnerTabs";
import { OwnerLanguageProvider } from "@/components/owner/OwnerLanguage";
import { PublicHeader } from "@/components/PublicHeader";
import { LocationSwitcher } from "@/components/owner/LocationSwitcher";
import { currentRestaurant, requireUser } from "@/lib/auth";
import { Notice } from "@/components/ui/notice";
import { ButtonLink } from "@/components/ui/button";
import { isCarteAdmin, listPlaceClaims } from "@/lib/db/claims";
import { fmt } from "@/lib/i18n/owner/format";
import { htmlLang, LANGUAGES, textDirection } from "@/lib/languages";
import { ownerStrings } from "@/lib/owner-language";
import { ownerLinks } from "@/lib/owner-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const [{ restaurant, all }, admin, { t, language }] = await Promise.all([
    currentRestaurant(supabase, user.id),
    isCarteAdmin(supabase),
    ownerStrings(),
  ]);
  const latestClaim = restaurant ? (await listPlaceClaims(supabase, restaurant.id))[0] : null;
  const claimStatus: Record<string, string> = {
    approved: t.layout.claimApproved,
    rejected: t.layout.claimRejected,
    transferred: t.layout.claimTransferred,
  };
  return (
    <div lang={htmlLang(language)} dir={textDirection(language)}>
      <PublicHeader signedIn language={language} />
      <OwnerLanguageProvider strings={t} language={language}>
        <LocationSwitcher
          restaurants={all}
          currentId={restaurant?.id ?? null}
          languages={LANGUAGES.map(({ code, label }) => ({ code, label }))}
        />
        <OwnerTabs links={ownerLinks(restaurant, admin, t.nav)} label={t.nav.label} />
        {restaurant?.suspended && (
          <div className="mx-auto max-w-5xl px-5 pt-5 print:hidden">
            <Notice tone="warning" role="alert">
              {t.layout.suspended}
            </Notice>
          </div>
        )}
        {latestClaim && latestClaim.status in claimStatus && (
          <div className="mx-auto max-w-5xl px-5 pt-5 print:hidden">
            <Notice tone={latestClaim.status === "approved" ? "success" : "warning"}>
              {fmt(t.layout.claimDecision, { status: claimStatus[latestClaim.status] })}{" "}
              {latestClaim.review_note}
              <ButtonLink href="/dashboard/claim" variant="ghost" size="sm">
                {t.layout.viewClaim}
              </ButtonLink>
            </Notice>
          </div>
        )}
        {/* Room for the phone tab bar, which is on every page. */}
        <div className="pb-28 md:pb-0">{children}</div>
      </OwnerLanguageProvider>
    </div>
  );
}
