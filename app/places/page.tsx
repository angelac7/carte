import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { Badge, CardImage, cardClass } from "@/components/cards";
import { Chip } from "@/components/Chip";
import { LocateButton } from "@/components/LocateButton";
import { BlurFade } from "@/components/motion/BlurFade";
import { PageHero } from "@/components/PageHero";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldClass, labelClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { carteLinksForPlaces } from "@/lib/db/places";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { PLACES_STRINGS } from "@/lib/i18n/places-strings";
import {
  htmlLang,
  isLanguageCode,
  LANGUAGE_COOKIE,
  languageFromAcceptHeader,
} from "@/lib/languages";
import { distanceMeters, formatDistance, type OsmPlace } from "@/lib/places/normalize";
import { geocode, searchPlaces } from "@/lib/places/osm";
import { publicAsset } from "@/lib/public-asset";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Restaurants nearby | Carte" };

type Params = Record<string, string | string[] | undefined>;
type Status = "idle" | "done" | "notFound" | "failed";
const one = (value: Params[string]) => ((Array.isArray(value) ? value[0] : value) ?? "").trim();

export default async function PlacesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const headerStore = await headers();
  const saved = cookieStore.get(LANGUAGE_COOKIE)?.value;
  const language =
    saved && isLanguageCode(saved)
      ? saved
      : languageFromAcceptHeader(headerStore.get("accept-language") ?? "");
  const t = PLACES_STRINGS[language];
  const d = DINER_STRINGS[language];

  const query = one(params.q).slice(0, 60);
  const near = one(params.near).slice(0, 100);
  const lat = Number(one(params.lat));
  const lon = Number(one(params.lon));
  const hasCoordinates =
    one(params.lat) !== "" && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && Number.isFinite(lon);

  let status: Status = "idle";
  let results: (OsmPlace & { distance: number })[] = [];
  let carteLinks = new Map<string, string>();

  if (near || hasCoordinates) {
    const allowed = checkRateLimit(
      `places:${clientKeyFromHeaders(headerStore)}`,
      30,
      10 * 60 * 1000,
    );
    try {
      if (!allowed) throw new Error("rate limited");
      const center = near ? await geocode(near) : { lat, lon };
      if (!center) {
        status = "notFound";
      } else {
        results = (await searchPlaces(center, query))
          .map((place) => ({ ...place, distance: distanceMeters(center, place) }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 30);
        carteLinks = await carteLinksForPlaces(
          await createClient(),
          results.map((place) => place.id),
        );
        status = "done";
      }
    } catch (err) {
      console.error("Nearby search failed:", err);
      status = "failed";
    }
  }

  const inputClass = fieldClass("mt-2 bg-paper px-4 py-3 text-base");

  return (
    <>
      <PublicHeader />
      <PageHero
        title={t.title}
        intro={t.intro}
        image={publicAsset("images/places.jpg")}
        lang={htmlLang(language)}
      />

      <main lang={htmlLang(language)} className="relative z-10 mx-auto -mt-10 max-w-5xl px-5 pb-20">
        <form
          action="/places"
          method="get"
          className="rounded-2xl border border-line bg-card p-5 shadow-xl sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>{t.near}</span>
              <input
                name="near"
                defaultValue={near}
                maxLength={100}
                placeholder={t.nearPlaceholder}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>{t.queryLabel}</span>
              <input
                name="q"
                defaultValue={query}
                maxLength={60}
                placeholder={t.queryPlaceholder}
                className={inputClass}
              />
            </label>
          </div>
          <input
            type="hidden"
            name="lat"
            defaultValue={hasCoordinates && !near ? String(lat) : ""}
          />
          <input
            type="hidden"
            name="lon"
            defaultValue={hasCoordinates && !near ? String(lon) : ""}
          />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" className={buttonClass({ size: "lg", shine: true })}>
              {t.search}
            </button>
            <LocateButton
              label={t.useLocation}
              locatingLabel={t.locating}
              failedLabel={t.locationFailed}
            />
          </div>
        </form>

        {status === "notFound" && <EmptyState className="mt-10">{t.notFoundLocation}</EmptyState>}
        {status === "failed" && (
          <Notice tone="warning" role="alert" className="mt-10">
            {t.lookupFailed}
          </Notice>
        )}
        {status === "done" && results.length === 0 && (
          <EmptyState className="mt-10">{t.noResults}</EmptyState>
        )}

        {results.length > 0 && (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((place, index) => {
              const carteSlug = carteLinks.get(place.id);
              const href = carteSlug ? `/r/${carteSlug}` : `/place/${place.id}`;
              return (
                <li key={place.id}>
                  <BlurFade delay={Math.min(index, 8) * 0.05}>
                    <article className={cardClass}>
                      <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
                        <CardImage
                          src={null}
                          alt=""
                          index={index}
                          monogram={place.name.charAt(0)}
                          className="aspect-[16/9]"
                        >
                          <Badge className="tabular-nums">
                            {formatDistance(place.distance, language)}
                          </Badge>
                          {carteSlug && (
                            <Badge tone="basil" className="right-3 left-auto">
                              {t.onCarte}
                            </Badge>
                          )}
                        </CardImage>
                      </Link>
                      <div className="p-5">
                        <h2 className="font-serif text-xl leading-snug">
                          <Link href={href} className="hover:underline">
                            {place.name}
                          </Link>
                        </h2>
                        {(place.cuisine.length > 0 || place.address) && (
                          <p className="mt-1 text-sm text-muted">
                            {[place.cuisine.join(", "), place.address].filter(Boolean).join(", ")}
                          </p>
                        )}
                        {place.diets.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {place.diets.map((diet) => (
                              <Chip key={diet} label={d.tags[diet]} tone="allergen" />
                            ))}
                          </div>
                        )}
                        <Link
                          href={href}
                          className="mt-4 inline-block text-sm font-medium underline underline-offset-4 hover:text-muted"
                        >
                          {carteSlug ? t.viewMenu : t.details}
                        </Link>
                      </div>
                    </article>
                  </BlurFade>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-12 border-t border-line pt-5 text-xs leading-relaxed text-muted">
          {t.sourceNote}{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-ink"
          >
            {t.credit}
          </a>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
