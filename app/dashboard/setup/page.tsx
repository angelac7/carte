import { safeNextPath } from "@/lib/safe-redirect";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { SetupForm } from "@/components/owner/SetupForm";
import { currentRestaurant, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Set up your restaurant | Carte" };

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; another?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next ?? null);
  const { supabase, user } = await requireUser();
  // Owners with a restaurant come here only to add another location.
  const adding = params.another === "1";
  if (!adding && (await currentRestaurant(supabase, user.id)).restaurant) redirect(next);

  return (
    <main id="main" className="mx-auto max-w-xl px-5 py-12">
      <OwnerPageHeader
        title={adding ? "Add a location" : "Set up your restaurant"}
        intro={
          adding
            ? "Each location gets its own menu, QR code, and link. Switch between them from your dashboard."
            : "Add your restaurant’s name and choose the link diners will use to open your menu."
        }
      />
      <SetupForm next={next} />
    </main>
  );
}
