import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { Button, ButtonLink } from "@/components/ui/button";
import { RESTAURANT_COOKIE, requireUser } from "@/lib/auth";
import { acceptInvite, isInviteCode, peekInvite } from "@/lib/db/team";
import { fmt } from "@/lib/i18n/owner/format";
import { htmlLang, textDirection } from "@/lib/languages";
import { ownerStrings, ownerTitle } from "@/lib/owner-language";

export const dynamic = "force-dynamic";
export const generateMetadata = (): Promise<Metadata> => ownerTitle((t) => t.join.pageTitle);

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
  const { t, language } = await ownerStrings();

  return (
    <>
      <PublicHeader signedIn language={language} />
      <main
        id="main"
        lang={htmlLang(language)}
        dir={textDirection(language)}
        className="mx-auto max-w-xl px-5 py-24 pb-32 md:pb-24"
      >
        {name ? (
          <>
            <h1 className="font-serif text-5xl leading-[0.95] tracking-tighter sm:text-6xl">
              {fmt(t.join.title, { name })}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">{fmt(t.join.text, { name })}</p>
            <form action={join.bind(null, code)} className="mt-10">
              <Button type="submit" size="lg" shine>
                {t.join.join}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="font-serif text-5xl leading-[0.95] tracking-tighter sm:text-6xl">
              {t.join.unusableTitle}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">{t.join.unusableText}</p>
            <ButtonLink href="/dashboard" className="mt-10">
              {t.join.dashboard}
            </ButtonLink>
          </>
        )}
      </main>
    </>
  );
}
