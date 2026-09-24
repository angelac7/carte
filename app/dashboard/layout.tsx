import { OwnerHeader } from "@/components/owner/OwnerHeader";
import { requireUser } from "@/lib/auth";
import { Notice } from "@/components/ui/notice";
import { ButtonLink } from "@/components/ui/button";
import { isCarteAdmin, listPlaceClaims } from "@/lib/db/claims";
import { getOwnerRestaurant } from "@/lib/db";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const [restaurant, admin] = await Promise.all([
    getOwnerRestaurant(supabase, user.id),
    isCarteAdmin(supabase),
  ]);
  const latestClaim = restaurant ? (await listPlaceClaims(supabase, restaurant.id))[0] : null;
  return (
    <>
      <OwnerHeader restaurant={restaurant} admin={admin} />
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
      {children}
    </>
  );
}
