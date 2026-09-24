import type { Metadata } from "next";
import Link from "next/link";
import { claimPlaceAction } from "@/app/dashboard/claim/actions";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { requireRestaurant } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { getClaim } from "@/lib/db/places";
import { PLACES_STRINGS } from "@/lib/i18n/places-strings";
import { isValidPlaceId, type OsmPlace } from "@/lib/places/normalize";
import { getPlace } from "@/lib/places/osm";

export const metadata: Metadata = { title: "Link your map listing | Carte" };

type Params = Record<string, string | string[] | undefined>;
const one = (value: Params[string]) => (Array.isArray(value) ? value[0] : value) ?? "";
const panelClass = "mt-8 rounded-panel bg-paper p-6 shadow-raised sm:p-8";

const ERRORS: Record<string, string> = {
  taken: "Another Carte restaurant has already claimed this listing. Contact Carte if it's yours.",
  missing: "That map listing couldn't be found. Try finding your restaurant again.",
  failed: "The claim couldn't be saved. Try again.",
};

export default async function ClaimPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { supabase, restaurant } = await requireRestaurant();
  const params = await searchParams;
  const placeId = one(params.place);
  const error = ERRORS[one(params.error)];
  const justClaimed = one(params.claimed) === "1";

  const claim = await getClaim(supabase, restaurant.id);
  let place: OsmPlace | null = null;
  if (isValidPlaceId(placeId) && placeId !== claim.placeId) {
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

      {claim.placeId && (
        <div className={panelClass}>
          <p
            className={cn(
              "eyebrow inline-block rounded-full px-3 py-1.5",
              claim.verified ? "bg-basil-soft text-basil" : "bg-saffron-soft text-saffron-ink",
            )}
          >
            {claim.verified ? "Verified" : "Waiting for verification"}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {claim.verified
              ? "Diners who find your restaurant on the map can open your Carte menu."
              : "Carte will confirm you own this restaurant before linking it for diners. This usually means a quick call to the restaurant."}
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
          {claim.placeId && (
            <p className="mt-3 text-sm text-tomato">
              This replaces your current listing link and needs verification again.
            </p>
          )}
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
