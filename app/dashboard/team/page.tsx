import type { Metadata } from "next";
import { cancelInviteAction, removeMemberAction } from "@/app/dashboard/team/actions";
import { InviteLink } from "@/components/owner/InviteLink";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { Button } from "@/components/ui/button";
import { emailsFor } from "@/lib/account";
import { requireOwnedRestaurant } from "@/lib/auth";
import { listOpenInvites, listTeam } from "@/lib/db/team";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Team | Carte" };

const panelClass = "mt-8 rounded-panel bg-paper p-6 shadow-raised sm:p-8";

export default async function TeamPage() {
  const { supabase, restaurant } = await requireOwnedRestaurant("/dashboard/team");
  const [team, invites] = await Promise.all([
    listTeam(supabase, restaurant.id),
    listOpenInvites(supabase, restaurant.id),
  ]);
  const emails = await emailsFor(team.map((member) => member.userId));

  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader
        title="Team"
        intro={`Invite people to help keep ${restaurant.name}’s menu up to date. Editors can change and confirm dishes and the profile. Only you manage the team and the map listing.`}
      />

      <section className={panelClass}>
        <h2 className="font-serif text-3xl tracking-tight">Editors</h2>
        {team.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No one else yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/10">
            {team.map((member) => (
              <li key={member.userId} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0 break-all">{emails.get(member.userId) || "Editor"}</span>
                <form action={removeMemberAction}>
                  <input type="hidden" name="user" value={member.userId} />
                  <Button type="submit" variant="danger" size="sm">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={panelClass}>
        <h2 className="font-serif text-3xl tracking-tight">Invite someone</h2>
        <p className="mt-2 mb-5 text-sm text-muted">
          They&apos;ll need a Carte account. Anyone with the link can join, so share it only with
          the person you mean to add.
        </p>
        <InviteLink siteUrl={siteUrl()} />
        {invites.length > 0 && (
          <div className="mt-6">
            <h3 className="eyebrow text-muted">Unused invite links</h3>
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
                      Cancel
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
