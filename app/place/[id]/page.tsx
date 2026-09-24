import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { Chip } from "@/components/Chip";
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
import { coordinatesUrl, isValidPlaceId, type OsmPlace } from "@/lib/places/normalize";
import { getPlace } from "@/lib/places/osm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Restaurant | Carte" };

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidPlaceId(id)) notFound();

  const cookieStore = await cookies();
  const saved = cookieStore.get(LANGUAGE_COOKIE)?.value;
  const language =
    saved && isLanguageCode(saved)
      ? saved
      : languageFromAcceptHeader((await headers()).get("accept-language") ?? "");
  const t = PLACES_STRINGS[language];
  const d = DINER_STRINGS[language];

  let place: OsmPlace | null = null;
  let failed = false;
  try {
    place = await getPlace(id);
  } catch (err) {
    console.error("Place lookup failed:", err);
    failed = true;
  }
  if (!place && !failed) notFound();

  const carteSlug = place
    ? (await carteLinksForPlaces(await createClient(), [place.id])).get(place.id)
    : undefined;
  const linkClass = "underline underline-offset-4 hover:text-muted";

  return (
    <>
      <PublicHeader />
      <main lang={htmlLang(language)} className="mx-auto max-w-3xl px-5 py-12">
        {!place ? (
          <p role="alert" className="text-tomato">
            {t.lookupFailed}
          </p>
        ) : (
          <>
            <h1 className="font-serif text-4xl leading-tight">{place.name}</h1>
            {place.cuisine.length > 0 && (
              <p className="mt-2 text-muted">{place.cuisine.join(", ")}</p>
            )}
            {(place.address || place.city) && (
              <p className="mt-1">{[place.address, place.city].filter(Boolean).join(", ")}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <a
                href={coordinatesUrl(place)}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {t.directions}
              </a>
              {place.website && (
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={linkClass}
                >
                  {t.website}
                </a>
              )}
              {place.phone && (
                <a href={`tel:${place.phone.replace(/[^\d+]/g, "")}`} className={linkClass}>
                  {t.call}
                </a>
              )}
            </div>

            {place.openingHours && (
              <div className="mt-6">
                <h2 className="text-sm font-medium">{t.hours}</h2>
                <p className="mt-1 text-sm text-muted">{place.openingHours}</p>
              </div>
            )}

            {place.diets.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-medium">{t.dietOptions}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {place.diets.map((diet) => (
                    <Chip key={diet} label={d.tags[diet]} tone="allergen" />
                  ))}
                </div>
              </div>
            )}

            <section className="mt-8 rounded-lg border border-line bg-card p-5">
              {carteSlug ? (
                <Link
                  href={`/r/${carteSlug}`}
                  className="inline-block rounded-md bg-basil px-4 py-2 text-sm font-medium text-white hover:bg-basil/90"
                >
                  {t.viewMenu}
                </Link>
              ) : (
                <>
                  <p className="text-muted">{t.noMenu}</p>
                  <Link
                    href="/scan"
                    className="mt-4 inline-block rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
                  >
                    {t.scanMenu}
                  </Link>
                  <p className="mt-5 border-t border-line pt-4 text-sm">
                    {t.ownerPrompt}{" "}
                    <Link href={`/dashboard/claim?place=${place.id}`} className={linkClass}>
                      {t.ownerLink}
                    </Link>
                  </p>
                </>
              )}
            </section>

            <p className="mt-8 text-sm leading-relaxed text-muted">{d.safetyNotice}</p>
          </>
        )}

        <p className="mt-6 text-xs text-muted">
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
