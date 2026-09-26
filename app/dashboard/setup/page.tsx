import { safeNextPath } from "@/lib/safe-redirect";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { SetupForm } from "@/components/owner/SetupForm";
import { currentRestaurant, requireUser } from "@/lib/auth";
import { ownerStrings } from "@/lib/owner-language";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await ownerStrings();
  return { title: `${t.setup.titleNew} | Carte` };
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; another?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next ?? null);
  const { supabase, user } = await requireUser();
  const { t } = await ownerStrings();
  // Owners with a restaurant come here only to add another location.
  const adding = params.another === "1";
  if (!adding && (await currentRestaurant(supabase, user.id)).restaurant) redirect(next);

  return (
    <main id="main" className="mx-auto max-w-xl px-5 py-12">
      <OwnerPageHeader
        title={adding ? t.setup.titleAnother : t.setup.titleNew}
        intro={adding ? t.setup.introAnother : t.setup.introNew}
      />
      <SetupForm next={next} />
    </main>
  );
}
