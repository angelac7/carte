import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { Chip } from "@/components/Chip";
import { LocateButton } from "@/components/LocateButton";
import { PublicHeader } from "@/components/PublicHeader";
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

  const inputClass =
    "mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 focus:border-ink focus:outline-none";

  return (
    <>
      <PublicHeader />
      <main lang={htmlLang(language)} className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-serif text-4xl leading-tight">{t.title}</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-muted">{t.intro}</p>

        <form
          action="/places"
          method="get"
          className="mt-8 space-y-4 rounded-lg border border-line bg-card p-5 sm:p-6"
        >
          <label className="block">
            <span className="text-sm font-medium">{t.near}</span>
            <input
              name="near"
              defaultValue={near}
              maxLength={100}
              placeholder={t.nearPlaceholder}
              className={inputClass}
            />
          </label>
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
          <label className="block">
            <span className="text-sm font-medium">{t.queryLabel}</span>
            <input
              name="q"
              defaultValue={query}
              maxLength={60}
              placeholder={t.queryPlaceholder}
              className={inputClass}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-md bg-ink px-5 py-2 text-sm font-medium text-white hover:bg-ink/90"
            >
              {t.search}
            </button>
            <LocateButton
              label={t.useLocation}
              locatingLabel={t.locating}
              failedLabel={t.locationFailed}
            />
          </div>
        </form>

        {status === "notFound" && <p className="mt-8 text-muted">{t.notFoundLocation}</p>}
        {status === "failed" && (
          <p role="alert" className="mt-8 text-tomato">
            {t.lookupFailed}
          </p>
        )}
        {status === "done" && results.length === 0 && (
          <p className="mt-8 text-muted">{t.noResults}</p>
        )}

        {results.length > 0 && (
          <ul className="mt-8 divide-y divide-line rounded-lg border border-line bg-card px-5 sm:px-6">
            {results.map((place) => {
              const carteSlug = carteLinks.get(place.id);
              return (
                <li key={place.id} className="py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-serif text-xl">
                      <Link href={`/place/${place.id}`} className="hover:underline">
                        {place.name}
                      </Link>
                    </h2>
                    <span className="text-sm text-muted tabular-nums">
                      {formatDistance(place.distance, language)}
                    </span>
                  </div>
                  {(place.cuisine.length > 0 || place.address) && (
                    <p className="text-sm text-muted">
                      {[place.cuisine.join(", "), place.address].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {carteSlug && <Chip label={t.onCarte} tone="tag" />}
                    {place.diets.map((diet) => (
                      <Chip key={diet} label={d.tags[diet]} tone="allergen" />
                    ))}
                  </div>
                  <div className="mt-3 flex gap-4 text-sm">
                    <Link
                      href={carteSlug ? `/r/${carteSlug}` : `/place/${place.id}`}
                      className="font-medium underline underline-offset-4 hover:text-muted"
                    >
                      {carteSlug ? t.viewMenu : t.details}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-8 text-xs text-muted">
          {t.sourceNote}{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {t.credit}
          </a>
        </p>
      </main>
    </>
  );
}
