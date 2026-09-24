import { safeNextPath } from "@/lib/safe-redirect";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { SetupForm } from "@/components/owner/SetupForm";
import { requireUser } from "@/lib/auth";
import { getOwnerRestaurant } from "@/lib/db";

export const metadata: Metadata = { title: "Set up your restaurant | Carte" };

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next ?? null);
  const { supabase, user } = await requireUser();
  if (await getOwnerRestaurant(supabase, user.id)) redirect(next);

  return (
    <main id="main" className="mx-auto max-w-xl px-5 py-12">
      <OwnerPageHeader
        title="Set up your restaurant"
        intro="Add your restaurant’s name and choose the link diners will use to open your menu."
      />
      <SetupForm next={next} />
    </main>
  );
}
