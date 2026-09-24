import type { Metadata } from "next";
import Link from "@/components/OfflineLink";
import { claimPlaceAction } from "@/app/dashboard/claim/actions";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { requireRestaurant } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { listPlaceClaims } from "@/lib/db/claims";
import { fieldClass } from "@/components/ui/field";
import { getClaim } from "@/lib/db/places";
import { PLACES_STRINGS } from "@/lib/i18n/places-strings";
import { isValidPlaceId, type OsmPlace } from "@/lib/places/normalize";
import { checkRateLimit } from "@/lib/rate-limit";
import { getPlace } from "@/lib/places/osm";

export const metadata: Metadata = { title: "Link your map listing | Carte" };

type Params = Record<string, string | string[] | undefined>;
const one = (value: Params[string]) => (Array.isArray(value) ? value[0] : value) ?? "";
const panelClass = "mt-8 rounded-panel bg-paper p-6 shadow-raised sm:p-8";

const ERRORS: Record<string, string> = {
  evidence: "Describe how Carte can verify your ownership (20–2000 characters).",
  limited: "Too many map lookups. Please try again later.",
  taken: "Another Carte restaurant has already claimed this listing. Contact Carte if it's yours.",
  missing: "That map listing couldn't be found. Try finding your restaurant again.",
  failed: "The claim couldn't be saved. Try again.",
};

export default async function ClaimPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const { supabase, restaurant } = await requireRestaurant(
    `/dashboard/claim?place=${encodeURIComponent(one(params.place))}`,
  );
  const placeId = one(params.place);
  const error = ERRORS[one(params.error)];
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
        title="Link your map listing"
        intro={`Link ${restaurant.name} to its listing on the map, so diners who find your restaurant nearby can open your confirmed Carte menu.`}
      />

      {justClaimed && (
        <Notice tone="success" role="status" className="mt-6">
          Claim sent. We filled in any empty profile details from the map; check them on your
          Profile page.
        </Notice>
      )}
      {error && (
        <Notice tone="warning" role="alert" className="mt-6">
          {error}
        </Notice>
      )}

      {latest && (
        <Notice tone={latest.status === "approved" ? "success" : "warning"} className="mt-6">
          <p>
            Latest claim: {latest.status} · {latest.place_id}
          </p>
          {latest.review_note && <p className="mt-2 whitespace-pre-wrap">{latest.review_note}</p>}
          {(latest.status === "rejected" || latest.status === "transferred") && (
            <Link
              href={`/dashboard/claim?place=${latest.place_id}`}
              className="mt-3 inline-block underline"
            >
              Submit new ownership evidence
            </Link>
          )}
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
              ? "Verified"
              : latest?.status === "pending"
                ? "Waiting for verification"
                : "Not verified"}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {claim.verified
              ? "Diners who find your restaurant on the map can open your Carte menu."
              : "Carte will confirm you own this restaurant before linking it for diners. Check this page for the decision and any follow-up request."}
          </p>
          <Link
            href={`/place/${claim.placeId}`}
            className="mt-3 inline-block text-sm underline underline-offset-4 hover:text-muted"
          >
            View your map listing
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
              <p>
                Latest claim: {latest.status} · {latest.place_id}
              </p>
              {latest.review_note && (
                <p className="mt-2 whitespace-pre-wrap">{latest.review_note}</p>
              )}
              {(latest.status === "rejected" || latest.status === "transferred") && (
                <Link
                  href={`/dashboard/claim?place=${latest.place_id}`}
                  className="mt-3 inline-block underline"
                >
                  Submit new ownership evidence
                </Link>
              )}
            </Notice>
          )}

          {claim.placeId && (
            <p className="mt-3 text-sm text-tomato">
              Changing your listing needs verification again. Claims to an existing listing are
              reviewed as disputes.
            </p>
          )}
          <label className="mt-5 block text-sm font-medium">
            Ownership evidence
            <textarea
              name="evidence"
              required
              minLength={20}
              maxLength={2000}
              rows={4}
              className={fieldClass("mt-2")}
              placeholder="Your role, a business website, and how Carte can independently verify ownership. Do not include passwords or identity documents."
            />
          </label>
          <Button type="submit" shine className="mt-5">
            This is my restaurant
          </Button>
        </form>
      )}

      {!place && !claim.placeId && (
        <EmptyState className="mt-6 text-sm">
          Find your restaurant on the{" "}
          <Link href="/places" className="underline underline-offset-4 hover:text-ink">
            Nearby page
          </Link>
          , open it, and choose &ldquo;Put your menu on Carte.&rdquo;
        </EmptyState>
      )}

      {(place || claim.placeId) && (
        <p className="mt-10 border-t border-ink/15 pt-5 text-xs leading-relaxed text-muted">
          {PLACES_STRINGS.en.sourceNote}{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-ink"
          >
            {PLACES_STRINGS.en.credit}
          </a>
        </p>
      )}
    </main>
  );
}
