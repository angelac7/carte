import { cancelInviteAction, removeMemberAction } from "@/app/dashboard/team/actions";
import { InviteLink } from "@/components/owner/InviteLink";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { Button } from "@/components/ui/button";
import { emailsFor } from "@/lib/account";
import { requireOwnedRestaurant } from "@/lib/auth";
import { listOpenInvites, listTeam } from "@/lib/db/team";
import { siteUrl } from "@/lib/site-url";
import { fmt } from "@/lib/i18n/owner/format";
import { ownerStrings, ownerTitle } from "@/lib/owner-language";

export const dynamic = "force-dynamic";
export const generateMetadata = () => ownerTitle((t) => t.team.title);

const panelClass = "mt-8 rounded-panel bg-paper p-6 shadow-raised sm:p-8";

export default async function TeamPage() {
  const { supabase, restaurant } = await requireOwnedRestaurant("/dashboard/team");
  const { t } = await ownerStrings();
  const [team, invites] = await Promise.all([
    listTeam(supabase, restaurant.id),
    listOpenInvites(supabase, restaurant.id),
  ]);
  const emails = await emailsFor(team.map((member) => member.userId));

  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader title={t.team.title} intro={fmt(t.team.intro, { name: restaurant.name })} />

      <section className={panelClass}>
        <h2 className="font-serif text-3xl tracking-tight">{t.team.editors}</h2>
        {team.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t.team.noOne}</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/10">
            {team.map((member) => (
              <li key={member.userId} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0 break-all">
                  {emails.get(member.userId) || t.team.editor}
                </span>
                <form action={removeMemberAction}>
                  <input type="hidden" name="user" value={member.userId} />
                  <Button type="submit" variant="danger" size="sm">
                    {t.team.remove}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={panelClass}>
        <h2 className="font-serif text-3xl tracking-tight">{t.team.inviteTitle}</h2>
        <p className="mt-2 mb-5 text-sm text-muted">{t.team.inviteText}</p>
        <InviteLink siteUrl={siteUrl()} />
        {invites.length > 0 && (
          <div className="mt-6">
            <h3 className="eyebrow text-muted">{t.team.unused}</h3>
            <ul className="mt-2 divide-y divide-ink/10">
              {invites.map((invite) => (
                <li
                  key={invite.code}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="font-mono">…{invite.code.slice(-4)}</span>
                  <form action={cancelInviteAction}>
                    <input type="hidden" name="code" value={invite.code} />
                    <Button type="submit" variant="danger" size="sm">
                      {t.team.cancel}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
