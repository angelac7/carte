import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { Button, ButtonLink } from "@/components/ui/button";
import { RESTAURANT_COOKIE, requireUser } from "@/lib/auth";
import { acceptInvite, isInviteCode, peekInvite } from "@/lib/db/team";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Join a restaurant | Carte" };

async function join(code: string) {
  "use server";
  const { supabase } = await requireUser(`/join/${code}`);
  const restaurantId = isInviteCode(code) ? await acceptInvite(supabase, code) : null;
  if (!restaurantId) redirect(`/join/${code}`);
  (await cookies()).set(RESTAURANT_COOKIE, restaurantId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  redirect("/dashboard");
}

/** Opened from an owner's invite link: asks before joining, so a preview can't use it up. */
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { supabase } = await requireUser(`/join/${code}`);
  const name = isInviteCode(code) ? await peekInvite(supabase, code) : null;

  return (
    <>
      <PublicHeader signedIn />
      <main id="main" className="mx-auto max-w-xl px-5 py-24 pb-32 md:pb-24">
        {name ? (
          <>
            <h1 className="font-serif text-5xl leading-[0.95] tracking-tighter sm:text-6xl">
              Join {name}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              You&apos;ll be able to change and confirm {name}&apos;s menu and profile. Only confirm
              allergens you&apos;ve checked with the kitchen.
            </p>
            <form action={join.bind(null, code)} className="mt-10">
              <Button type="submit" size="lg" shine>
                Join as an editor
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="font-serif text-5xl leading-[0.95] tracking-tighter sm:text-6xl">
              This invite can&apos;t be used
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              It may have expired or already been used. Ask the restaurant&apos;s owner for a new
              link.
            </p>
            <ButtonLink href="/dashboard" className="mt-10">
              Go to your dashboard
            </ButtonLink>
          </>
        )}
      </main>
    </>
  );
}
