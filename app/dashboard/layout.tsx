import { OwnerTabs } from "@/components/owner/OwnerTabs";
import { PublicHeader } from "@/components/PublicHeader";
import { LocationSwitcher } from "@/components/owner/LocationSwitcher";
import { currentRestaurant, requireUser } from "@/lib/auth";
import { Notice } from "@/components/ui/notice";
import { ButtonLink } from "@/components/ui/button";
import { isCarteAdmin, listPlaceClaims } from "@/lib/db/claims";
import { ownerLinks } from "@/lib/owner-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const [{ restaurant, all }, admin] = await Promise.all([
    currentRestaurant(supabase, user.id),
    isCarteAdmin(supabase),
  ]);
  const latestClaim = restaurant ? (await listPlaceClaims(supabase, restaurant.id))[0] : null;
  return (
    <>
      <PublicHeader signedIn />
      {restaurant && <LocationSwitcher restaurants={all} currentId={restaurant.id} />}
      <OwnerTabs links={ownerLinks(restaurant, admin)} />
      {latestClaim && ["approved", "rejected", "transferred"].includes(latestClaim.status) && (
        <div className="mx-auto max-w-5xl px-5 pt-5">
          <Notice tone={latestClaim.status === "approved" ? "success" : "warning"}>
            Map claim {latestClaim.status}. {latestClaim.review_note}
            <ButtonLink href="/dashboard/claim" variant="ghost" size="sm">
              View claim decision
            </ButtonLink>
          </Notice>
        </div>
      )}
      {/* Room for the phone tab bar, which is on every page. */}
      <div className="pb-28 md:pb-0">{children}</div>
    </>
  );
}
