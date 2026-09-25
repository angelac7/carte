import type { Metadata } from "next";
import Link from "@/components/OfflineLink";
import { notFound } from "next/navigation";
import { moderateAction } from "@/app/admin/actions";
import { PublicHeader } from "@/components/PublicHeader";
import { Button, ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { listAllRestaurants } from "@/lib/db/admin";
import { isCarteAdmin } from "@/lib/db/claims";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin | Carte" };

/** Every restaurant on Carte, for its administrators, with a way to suspend a menu. */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { supabase } = await requireUser("/admin");
  if (!(await isCarteAdmin(supabase))) notFound();
  const page = Math.max(0, Math.min(1000, Math.floor(Number((await searchParams).page) || 0)));
  const restaurants = await listAllRestaurants(supabase, page);

  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto max-w-5xl px-5 pt-12 pb-32 md:pb-12">
        <h1 className="font-serif text-5xl leading-[0.95] tracking-tighter sm:text-6xl">Admin</h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/admin/claims" variant="secondary">
            Review map claims
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="ghost">
            Dashboard
          </ButtonLink>
        </div>

        <h2 className="mt-12 font-serif text-3xl tracking-tight">Restaurants</h2>
        <div className="mt-4 overflow-x-auto rounded-panel bg-paper shadow-raised">
          <table className="w-full min-w-[40rem] text-start text-sm">
            <thead className="eyebrow text-muted">
              <tr className="border-b border-ink/10">
                <th className="px-4 py-3 text-start font-normal">Restaurant</th>
                <th className="px-4 py-3 text-start font-normal">Dishes</th>
                <th className="px-4 py-3 text-start font-normal">Open reports</th>
                <th className="px-4 py-3 text-start font-normal">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/r/${r.slug}`}
                      className="font-medium underline underline-offset-4"
                    >
                      {r.name}
                    </Link>
                    <span className="block text-xs text-muted">/r/{r.slug}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.confirmed} of {r.dishes} confirmed
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.open_reports}</td>
                  <td className="px-4 py-3">
                    {r.suspended ? (
                      <span className="font-medium text-tomato">Suspended</span>
                    ) : r.listed ? (
                      "On Discover"
                    ) : (
                      "Menu link only"
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <form action={moderateAction}>
                      <input type="hidden" name="restaurant" value={r.id} />
                      <input type="hidden" name="suspend" value={String(!r.suspended)} />
                      <Button
                        type="submit"
                        size="sm"
                        variant={r.suspended ? "secondary" : "danger"}
                      >
                        {r.suspended ? "Restore" : "Suspend"}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex gap-3">
          {page > 0 && (
            <ButtonLink href={`/admin?page=${page - 1}`} variant="ghost" size="sm">
              Newer
            </ButtonLink>
          )}
          {restaurants.length === 100 && (
            <ButtonLink href={`/admin?page=${page + 1}`} variant="ghost" size="sm">
              Older
            </ButtonLink>
          )}
        </div>
      </main>
    </>
  );
}
