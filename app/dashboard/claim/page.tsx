import Link from "@/components/OfflineLink";
import { claimPlaceAction } from "@/app/dashboard/claim/actions";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { requireOwnedRestaurant } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { listPlaceClaims } from "@/lib/db/claims";
import { fieldClass } from "@/components/ui/field";
import { getClaim } from "@/lib/db/places";
import { PLACES_STRINGS } from "@/lib/i18n/places-strings";
import { isValidPlaceId, type OsmPlace } from "@/lib/places/normalize";
import { checkRateLimit } from "@/lib/rate-limit";
import { getPlace } from "@/lib/places/osm";
import { fmt } from "@/lib/i18n/owner/format";
import type { OwnerStrings } from "@/lib/i18n/owner-strings";
import { ownerStrings, ownerTitle } from "@/lib/owner-language";

export const generateMetadata = () => ownerTitle((t) => t.claim.title);

type Params = Record<string, string | string[] | undefined>;
const one = (value: Params[string]) => (Array.isArray(value) ? value[0] : value) ?? "";
const panelClass = "mt-8 rounded-panel bg-paper p-6 shadow-raised sm:p-8";

/** A claim's latest status, with a link to try again if it was turned down. */
function LatestClaim({
  claim,
  t,
}: {
  claim: { status: string; place_id: string; review_note: string | null };
  t: OwnerStrings;
}) {
  const status = t.claim.statuses[claim.status as keyof OwnerStrings["claim"]["statuses"]];
  return (
    <>
      <p>{fmt(t.claim.latest, { status: status ?? claim.status, place: claim.place_id })}</p>
      {claim.review_note && <p className="mt-2 whitespace-pre-wrap">{claim.review_note}</p>}
      {(claim.status === "rejected" || claim.status === "transferred") && (
        <Link
          href={`/dashboard/claim?place=${claim.place_id}`}
          className="mt-3 inline-block underline"
        >
          {t.claim.newEvidence}
        </Link>
      )}
    </>
  );
}

export default async function ClaimPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const { supabase, restaurant } = await requireOwnedRestaurant(
    `/dashboard/claim?place=${encodeURIComponent(one(params.place))}`,
  );
  const { t, language } = await ownerStrings();
  const placeId = one(params.place);
  const errorKey = one(params.error);
  const error =
    errorKey in t.claim.errors ? t.claim.errors[errorKey as keyof typeof t.claim.errors] : "";
  const justClaimed = one(params.claimed) === "1";

  const claim = await getClaim(supabase, restaurant.id);
  const requests = await listPlaceClaims(supabase, restaurant.id);
  const latest = requests[0];
  let place: OsmPlace | null = null;
  if (isValidPlaceId(placeId)) {
    if (await checkRateLimit(`claim:${restaurant.id}`, 30, 10 * 60 * 1000))
      place = await getPlace(placeId).catch(() => null);
  }

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-12">
      <OwnerPageHeader
        title={t.claim.title}
        intro={fmt(t.claim.intro, { name: restaurant.name })}
      />

      {justClaimed && (
        <Notice tone="success" role="status" className="mt-6">
          {t.claim.sent}
        </Notice>
      )}
      {error && (
        <Notice tone="warning" role="alert" className="mt-6">
          {error}
        </Notice>
      )}

      {latest && (
        <Notice tone={latest.status === "approved" ? "success" : "warning"} className="mt-6">
          <LatestClaim claim={latest} t={t} />
        </Notice>
      )}

      {claim.placeId && (
        <div className={panelClass}>
          <p
            className={cn(
              "eyebrow inline-block rounded-full px-3 py-1.5",
              claim.verified ? "bg-basil-soft text-basil" : "bg-saffron-soft text-saffron-ink",
            )}
          >
            {claim.verified
              ? t.claim.verified
              : latest?.status === "pending"
                ? t.claim.waiting
                : t.claim.notVerified}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {claim.verified ? t.claim.verifiedText : t.claim.waitingText}
          </p>
          <Link
            href={`/place/${claim.placeId}`}
            className="mt-3 inline-block text-sm underline underline-offset-4 hover:text-muted"
          >
            {t.claim.viewListing}
          </Link>
        </div>
      )}

      {place && (
        <form action={claimPlaceAction} className={panelClass}>
          <input type="hidden" name="place" value={place.id} />
          <p className="font-serif text-3xl tracking-tight">{place.name}</p>
          <p className="mt-1 text-sm text-muted">
            {[place.address, place.city, place.cuisine.join(", ")].filter(Boolean).join(", ")}
          </p>
          {latest && (
            <Notice tone={latest.status === "approved" ? "success" : "warning"} className="mt-6">
              <LatestClaim claim={latest} t={t} />
            </Notice>
          )}

          {claim.placeId && <p className="mt-3 text-sm text-tomato">{t.claim.changing}</p>}
          <label className="mt-5 block text-sm font-medium">
            {t.claim.evidence}
            <textarea
              name="evidence"
              required
              minLength={20}
              maxLength={2000}
              rows={4}
              className={fieldClass("mt-2")}
              placeholder={t.claim.evidencePlaceholder}
            />
          </label>
          <Button type="submit" shine className="mt-5">
            {t.claim.submit}
          </Button>
        </form>
      )}

      {!place && !claim.placeId && (
        <EmptyState className="mt-6 text-sm">
          {t.claim.findBefore}
          <Link href="/places" className="underline underline-offset-4 hover:text-ink">
            {t.claim.nearbyPage}
          </Link>
          {t.claim.findAfter}
        </EmptyState>
      )}

      {(place || claim.placeId) && (
        <p className="mt-10 border-t border-ink/15 pt-5 text-xs leading-relaxed text-muted">
          {PLACES_STRINGS[language].sourceNote}{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-ink"
          >
            {PLACES_STRINGS[language].credit}
          </a>
        </p>
      )}
    </main>
  );
}
