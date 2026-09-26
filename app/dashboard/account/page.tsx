import { AccountSettings } from "@/components/owner/AccountSettings";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { leaveRestaurantAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { currentRestaurant, requireUser } from "@/lib/auth";
import { fmt } from "@/lib/i18n/owner/format";
import { ownerStrings, ownerTitle } from "@/lib/owner-language";

export const dynamic = "force-dynamic";
export const generateMetadata = () => ownerTitle((t) => t.account.title);

export default async function AccountPage() {
  const { supabase, user } = await requireUser("/dashboard/account");
  const { restaurant } = await currentRestaurant(supabase, user.id);
  const { t } = await ownerStrings();
  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader title={t.account.title} intro={t.account.intro} />
      {restaurant?.role === "editor" && (
        <section className="mt-8 rounded-panel bg-paper p-6 shadow-raised sm:p-8">
          <h2 className="font-serif text-3xl tracking-tight">
            {fmt(t.account.helpTitle, { name: restaurant.name })}
          </h2>
          <p className="mt-2 text-sm text-muted">{t.account.helpText}</p>
          <form action={leaveRestaurantAction} className="mt-5">
            <Button type="submit" variant="secondary">
              {fmt(t.account.leave, { name: restaurant.name })}
            </Button>
          </form>
        </section>
      )}
      <AccountSettings email={user.email ?? ""} />
    </main>
  );
}
