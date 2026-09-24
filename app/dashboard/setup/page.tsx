import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { SetupForm } from "@/components/owner/SetupForm";
import { requireUser } from "@/lib/auth";
import { getOwnerRestaurant } from "@/lib/db";

export const metadata: Metadata = { title: "Set up your restaurant | Carte" };

export default async function SetupPage() {
  const { supabase, user } = await requireUser();
  if (await getOwnerRestaurant(supabase, user.id)) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <OwnerPageHeader
        title="Set up your restaurant"
        intro="Add your restaurant’s name and choose the link diners will use to open your menu."
      />
      <SetupForm />
    </main>
  );
}
