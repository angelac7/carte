import type { Metadata } from "next";
import Link from "@/components/OfflineLink";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { ButtonLink } from "@/components/ui/button";
import { aiLimits } from "@/lib/ai-budget";
import { AI_FEATURE_NAMES, summarizeAiUsage } from "@/lib/ai-usage-summary";
import { requireUser } from "@/lib/auth";
import { listAiUsage } from "@/lib/db/ai-usage";
import { isCarteAdmin } from "@/lib/db/claims";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AI use | Admin | Carte" };

const DAYS = 30;
const featureName = (feature: string) => AI_FEATURE_NAMES[feature] ?? feature;

/** How many AI calls Carte made today and lately, by restaurant and feature, against the limits. */
export default async function AiUsagePage() {
  const { supabase } = await requireUser("/admin/ai");
  if (!(await isCarteAdmin(supabase))) notFound();
  const limits = aiLimits();
  const usage = summarizeAiUsage(await listAiUsage(supabase, DAYS));
  const cell = "px-4 py-3 text-start";

  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto max-w-5xl px-5 pt-12 pb-32 md:pb-12">
        <h1 className="font-serif text-5xl leading-[0.95] tracking-tighter sm:text-6xl">AI use</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Every AI call Carte makes, counted once. Each restaurant can use {limits.perRestaurant} a
          day and all of Carte {limits.total}; past a limit, diners see the usual “try again soon”
          message. Days end at midnight UTC. Change the limits with AI_DAILY_LIMIT_PER_RESTAURANT
          and AI_DAILY_LIMIT in Vercel.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/admin" variant="secondary">
            Restaurants
          </ButtonLink>
        </div>

        <dl className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-panel bg-paper p-6 shadow-raised">
            <dt className="eyebrow text-muted">Today</dt>
            <dd className="mt-2 font-serif text-4xl tabular-nums">
              {usage.today} <span className="text-base text-muted">of {limits.total}</span>
            </dd>
          </div>
          <div className="rounded-panel bg-paper p-6 shadow-raised">
            <dt className="eyebrow text-muted">Last {DAYS} days</dt>
            <dd className="mt-2 font-serif text-4xl tabular-nums">{usage.recent}</dd>
          </div>
        </dl>

        <h2 className="mt-12 font-serif text-3xl tracking-tight">By restaurant</h2>
        {usage.restaurants.length === 0 ? (
          <p className="mt-4 text-muted">No AI calls in the last {DAYS} days.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-panel bg-paper shadow-raised">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="eyebrow text-muted">
                <tr className="border-b border-ink/10">
                  <th className={`${cell} font-normal`}>Restaurant</th>
                  <th className={`${cell} font-normal`}>Today</th>
                  <th className={`${cell} font-normal`}>Last {DAYS} days</th>
                  <th className={`${cell} font-normal`}>Most used today</th>
                </tr>
              </thead>
              <tbody>
                {usage.restaurants.map((r) => (
                  <tr key={r.id ?? "none"} className="border-b border-ink/5 last:border-0">
                    <td className={cell}>
                      {r.slug ? (
                        <Link
                          href={`/r/${r.slug}`}
                          className="font-medium underline underline-offset-4"
                        >
                          {r.name}
                        </Link>
                      ) : (
                        <span className="text-muted">{r.name}</span>
                      )}
                    </td>
                    <td className={`${cell} tabular-nums`}>
                      {r.today}
                      {r.id && (
                        <span
                          className={
                            r.today >= limits.perRestaurant
                              ? " font-medium text-tomato"
                              : " text-muted"
                          }
                        >
                          {" "}
                          of {limits.perRestaurant}
                        </span>
                      )}
                    </td>
                    <td className={`${cell} tabular-nums`}>{r.recent}</td>
                    <td className={cell}>{r.busiest ? featureName(r.busiest) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="mt-12 font-serif text-3xl tracking-tight">By feature</h2>
        {usage.features.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-panel bg-paper shadow-raised">
            <table className="w-full min-w-[28rem] text-sm">
              <thead className="eyebrow text-muted">
                <tr className="border-b border-ink/10">
                  <th className={`${cell} font-normal`}>Feature</th>
                  <th className={`${cell} font-normal`}>Today</th>
                  <th className={`${cell} font-normal`}>Last {DAYS} days</th>
                </tr>
              </thead>
              <tbody>
                {usage.features.map((f) => (
                  <tr key={f.feature} className="border-b border-ink/5 last:border-0">
                    <td className={cell}>{featureName(f.feature)}</td>
                    <td className={`${cell} tabular-nums`}>{f.today}</td>
                    <td className={`${cell} tabular-nums`}>{f.recent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
