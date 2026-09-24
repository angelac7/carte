import type { Metadata } from "next";
import Link from "next/link";
import { BlurFade } from "@/components/motion/BlurFade";
import { NumberTicker } from "@/components/motion/NumberTicker";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { ProgressRing } from "@/components/owner/ProgressRing";
import { ViewsChart } from "@/components/owner/ViewsChart";
import { ButtonLink } from "@/components/ui/button";
import { requireRestaurant } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { listDishes } from "@/lib/db";
import { getDailyViews, getDishViews } from "@/lib/db/owner-stats";
import { getClaim } from "@/lib/db/places";
import { getRestaurantProfile } from "@/lib/db/profile";
import { buildChecklist } from "@/lib/owner-checklist";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard | Carte" };

const panelClass = "rounded-panel bg-paper p-6 shadow-raised sm:p-8";

export default async function DashboardHome() {
  const { supabase, restaurant } = await requireRestaurant();
  const [dishes, profile, claim, dishViews, daily] = await Promise.all([
    listDishes(supabase, restaurant.id),
    getRestaurantProfile(supabase, restaurant.id),
    getClaim(supabase, restaurant.id),
    getDishViews(supabase).catch(() => []),
    getDailyViews(supabase).catch(() => []),
  ]);

  const confirmed = dishes.filter((dish) => dish.confirmed).length;
  const needReview = dishes.length - confirmed;
  const withPhotos = dishes.filter((dish) => dish.photo_url).length;
  const weekViews = dishViews.reduce((sum, dish) => sum + dish.views, 0);
  const topDishes = dishViews.filter((dish) => dish.views > 0).slice(0, 5);
  const topMax = Math.max(1, ...topDishes.map((dish) => dish.views));

  const checklist = buildChecklist({
    dishCount: dishes.length,
    needReview,
    withPhotos,
    hasProfile: Boolean(profile.cuisine && profile.city),
    listed: profile.listed,
    claim,
  });
  const stepsDone = checklist.filter((item) => item.done).length;

  const stats = [
    { label: "Dishes on your menu", value: dishes.length },
    { label: "Confirmed for diners", value: confirmed },
    { label: "Need review", value: needReview, alert: needReview > 0 },
    { label: "Dish views this week", value: weekViews },
  ];

  return (
    <main id="main" className="mx-auto max-w-5xl px-5 py-12">
      <OwnerPageHeader eyebrow="Welcome back" title={restaurant.name}>
        <ButtonLink href={`/r/${restaurant.slug}`} shine>
          View your diner menu
        </ButtonLink>
        <ButtonLink href="/dashboard/qr" variant="secondary">
          Print your QR code
        </ButtonLink>
      </OwnerPageHeader>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <BlurFade key={stat.label} delay={0.1 + index * 0.06} className="h-full">
            <div
              className={cn(
                panelClass,
                "h-full p-5 sm:p-6",
                stat.alert && "border-saffron/50 bg-saffron-soft",
              )}
            >
              <NumberTicker
                value={stat.value}
                className="block font-serif text-5xl leading-none tracking-tighter sm:text-6xl"
              />
              <p className={cn("eyebrow mt-4", stat.alert ? "text-saffron-ink" : "text-muted")}>
                {stat.label}
              </p>
              {stat.alert && (
                <Link
                  href="/dashboard/review"
                  className="mt-2 inline-block text-sm font-medium text-saffron-ink underline underline-offset-4"
                >
                  Review now
                </Link>
              )}
            </div>
          </BlurFade>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <BlurFade>
            <section className={panelClass}>
              <h2 className="font-serif text-3xl tracking-tight">Diner views</h2>
              <p className="mt-1 text-sm text-muted">
                How often diners opened your dishes’ details each day.
              </p>
              <div className="mt-8">
                <ViewsChart days={daily} />
              </div>
            </section>
          </BlurFade>

          <BlurFade>
            <section className={panelClass}>
              <h2 className="font-serif text-3xl tracking-tight">Most viewed this week</h2>
              {topDishes.length === 0 ? (
                <p className="mt-5 rounded-control px-4 py-8 text-center text-sm leading-relaxed text-muted shadow-pressed">
                  No views yet. Put your QR code on tables, and you’ll see which dishes diners open
                  most.
                </p>
              ) : (
                <ul className="mt-5 space-y-4">
                  {topDishes.map((dish) => (
                    <li key={dish.dishId}>
                      <div className="flex items-baseline justify-between gap-4 text-sm">
                        <span className="truncate font-medium">{dish.name}</span>
                        <span className="text-muted tabular-nums">{dish.views}</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full shadow-pressed-sm">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${(dish.views / topMax) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </BlurFade>
        </div>

        <BlurFade delay={0.1}>
          <section className={panelClass}>
            <div className="flex items-center gap-5">
              <ProgressRing done={stepsDone} total={checklist.length} />
              <div>
                <h2 className="font-serif text-3xl leading-tight tracking-tight">
                  {stepsDone === checklist.length ? "You’re all set" : "Finish setting up"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {stepsDone === checklist.length
                    ? "Every step is done."
                    : `${checklist.length - stepsDone} steps to go.`}
                </p>
              </div>
            </div>
            <ul className="mt-6 space-y-1">
              {checklist.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3 rounded-control px-3 py-2.5 transition-[box-shadow] duration-200 hover:shadow-pressed-sm"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs",
                        item.done
                          ? "bg-basil text-white shadow-pressed-color"
                          : "text-transparent shadow-pressed-sm",
                      )}
                    >
                      ✓
                    </span>
                    <span className="flex-1">
                      <span className={cn("block text-sm", item.done && "text-muted line-through")}>
                        {item.label}
                      </span>
                      {item.note && (
                        <span className="block text-xs text-saffron-ink">{item.note}</span>
                      )}
                    </span>
                    <span className="sr-only">{item.done ? "Done" : "Not done yet"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </BlurFade>
      </div>
    </main>
  );
}
