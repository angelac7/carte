import type { Metadata } from "next";
import Link from "@/components/OfflineLink";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { Chip } from "@/components/Chip";
import { PageHero } from "@/components/PageHero";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buttonClass } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
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

const pillClass = buttonClass({ variant: "glass" });

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
  const address = place ? [place.address, place.city].filter(Boolean).join(", ") : "";

  return (
    <>
      <PublicHeader />
      {!place ? (
        <main id="main" className="mx-auto max-w-3xl px-5 py-16">
          <Notice tone="warning" role="alert">
            {t.lookupFailed}
          </Notice>
        </main>
      ) : (
        <>
          <PageHero
            title={place.name}
            intro={place.cuisine.join(", ") || undefined}
            lang={htmlLang(language)}
            narrow
          >
            {address && <p className="text-white/80">{address}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={coordinatesUrl(place)}
                target="_blank"
                rel="noopener noreferrer"
                className={pillClass}
              >
                {t.directions}
              </a>
              {place.website && (
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={pillClass}
                >
                  {t.website}
                </a>
              )}
              {place.phone && (
                <a href={`tel:${place.phone.replace(/[^\d+]/g, "")}`} className={pillClass}>
                  {t.call}
                </a>
              )}
            </div>
          </PageHero>

          <main
            id="main"
            lang={htmlLang(language)}
            className="relative z-10 mx-auto -mt-10 max-w-3xl px-5 pb-20"
          >
            <section className="rounded-panel bg-paper p-6 shadow-raised-lg sm:p-8">
              {carteSlug ? (
                <Link
                  href={`/r/${carteSlug}`}
                  className={buttonClass({ variant: "basil", size: "lg", shine: true })}
                >
                  {t.viewMenu}
                </Link>
              ) : (
                <>
                  <p className="font-serif text-2xl leading-snug tracking-tight">{t.noMenu}</p>
                  <Link
                    href="/scan"
                    className={cn(buttonClass({ size: "lg", shine: true }), "mt-5")}
                  >
                    {t.scanMenu}
                  </Link>
                  <p className="mt-6 border-t border-ink/10 pt-5 text-sm">
                    {t.ownerPrompt}{" "}
                    <Link
                      href={`/dashboard/claim?place=${place.id}`}
                      className="underline underline-offset-4 hover:text-muted"
                    >
                      {t.ownerLink}
                    </Link>
                  </p>
                </>
              )}
            </section>

            {(place.openingHours || place.diets.length > 0) && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {place.openingHours && (
                  <section className="rounded-panel p-6 shadow-pressed">
                    <h2 className="eyebrow text-muted">{t.hours}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{place.openingHours}</p>
                  </section>
                )}
                {place.diets.length > 0 && (
                  <section className="rounded-panel p-6 shadow-pressed">
                    <h2 className="eyebrow text-muted">{t.dietOptions}</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {place.diets.map((diet) => (
                        <Chip key={diet} label={d.tags[diet]} tone="allergen" />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            <Notice className="mt-8">{d.safetyNotice}</Notice>
            <p className="mt-10 border-t border-ink/15 pt-5 text-xs leading-relaxed text-muted">
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
        </>
      )}
      <SiteFooter />
    </>
  );
}
