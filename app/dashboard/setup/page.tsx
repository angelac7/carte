import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SetupForm } from "@/components/owner/SetupForm";
import { requireUser } from "@/lib/auth";
import { getOwnerRestaurant } from "@/lib/db";

export const metadata: Metadata = { title: "Set up your restaurant | Carte" };

export default async function SetupPage() {
  const { supabase, user } = await requireUser();
  if (await getOwnerRestaurant(supabase, user.id)) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <h1 className="font-serif text-4xl leading-tight">Set up your restaurant</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Add your restaurant’s name and choose the link diners will use to open your menu.
      </p>
      <SetupForm />
    </main>
  );
}
