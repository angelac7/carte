import type { Metadata } from "next";
import { AccountSettings } from "@/components/owner/AccountSettings";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { leaveRestaurantAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { currentRestaurant, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account | Carte" };

export default async function AccountPage() {
  const { supabase, user } = await requireUser("/dashboard/account");
  const { restaurant } = await currentRestaurant(supabase, user.id);
  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader
        title="Account"
        intro="Change your login email or password, or delete your account."
      />
      {restaurant?.role === "editor" && (
        <section className="mt-8 rounded-panel bg-paper p-6 shadow-raised sm:p-8">
          <h2 className="font-serif text-3xl tracking-tight">You help edit {restaurant.name}</h2>
          <p className="mt-2 text-sm text-muted">
            Leaving removes your access to its menu. The owner can invite you again.
          </p>
          <form action={leaveRestaurantAction} className="mt-5">
            <Button type="submit" variant="secondary">
              Leave {restaurant.name}
            </Button>
          </form>
        </section>
      )}
      <AccountSettings email={user.email ?? ""} />
    </main>
  );
}
