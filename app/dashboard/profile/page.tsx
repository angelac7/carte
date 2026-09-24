import type { Metadata } from "next";
import { ProfileForm } from "@/components/owner/ProfileForm";
import { requireRestaurant } from "@/lib/auth";
import { getRestaurantProfile } from "@/lib/db/profile";

export const metadata: Metadata = { title: "Restaurant profile | Carte" };

export default async function ProfilePage() {
  const { supabase, restaurant } = await requireRestaurant();
  const profile = await getRestaurantProfile(supabase, restaurant.id);

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-serif text-4xl leading-tight">Restaurant profile</h1>
      <p className="mt-3 leading-relaxed text-muted">
        This appears on Carte Discover, where diners search for restaurants and dishes. It’s only
        shown once you turn on listing.
      </p>
      <ProfileForm profile={profile} />
    </main>
  );
}
