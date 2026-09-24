import type { Metadata } from "next";
import Link from "next/link";
import { claimPlaceAction } from "@/app/dashboard/claim/actions";
import { requireRestaurant } from "@/lib/auth";
import { getClaim } from "@/lib/db/places";
import { isValidPlaceId, type OsmPlace } from "@/lib/places/normalize";
import { getPlace } from "@/lib/places/osm";

export const metadata: Metadata = { title: "Link your map listing | Carte" };

type Params = Record<string, string | string[] | undefined>;
const one = (value: Params[string]) => (Array.isArray(value) ? value[0] : value) ?? "";

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
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-serif text-4xl leading-tight">Link your map listing</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Link {restaurant.name} to its listing on the map, so diners who find your restaurant nearby
        can open your confirmed Carte menu.
      </p>

      {justClaimed && (
        <p className="mt-6 rounded-md bg-basil-soft px-4 py-3 text-sm text-basil">
          Claim sent. We filled in any empty profile details from the map; check them on your
          Profile page.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 rounded-md bg-tomato/10 px-4 py-3 text-sm text-tomato">
          {error}
        </p>
      )}

      {claim.placeId && (
        <div className="mt-6 rounded-lg border border-line bg-card p-5">
          <p className="font-medium">{claim.verified ? "Verified" : "Waiting for verification"}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
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
        <form action={claimPlaceAction} className="mt-6 rounded-lg border border-line bg-card p-5">
          <input type="hidden" name="place" value={place.id} />
          <p className="font-serif text-2xl">{place.name}</p>
          <p className="mt-1 text-sm text-muted">
            {[place.address, place.city, place.cuisine.join(", ")].filter(Boolean).join(", ")}
          </p>
          {claim.placeId && (
            <p className="mt-3 text-sm text-tomato">
              This replaces your current listing link and needs verification again.
            </p>
          )}
          <button
            type="submit"
            className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
          >
            This is my restaurant
          </button>
        </form>
      )}

      {!place && !claim.placeId && (
        <p className="mt-6 text-sm text-muted">
          Find your restaurant on the{" "}
          <Link href="/places" className="underline underline-offset-4 hover:text-ink">
            Nearby page
          </Link>
          , open it, and choose &ldquo;Put your menu on Carte.&rdquo;
        </p>
      )}
    </main>
  );
}
