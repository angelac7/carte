import type { SupabaseClient } from "@supabase/supabase-js";
export type PlaceClaim = {
  id: string;
  restaurant_id: string;
  place_id: string;
  evidence: string;
  status: "pending" | "approved" | "rejected" | "superseded" | "transferred";
  review_note: string;
  revision: number;
  created_at: string;
  restaurants: {
    name: string;
    slug: string;
    address: string;
    osm_id: string | null;
    osm_verified: boolean;
  };
};
const columns =
  "id, restaurant_id, place_id, evidence, status, review_note, revision, created_at, restaurants(name, slug, address, osm_id, osm_verified)";
export async function isCarteAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_carte_admin");
  if (error) throw error;
  return data === true;
}
export async function listPlaceClaims(
  supabase: SupabaseClient,
  restaurantId?: string,
  pendingOnly = false,
  offset = 0,
): Promise<PlaceClaim[]> {
  let query = supabase
    .from("place_claims")
    .select(columns)
    .order("created_at", { ascending: false })
    .range(offset, offset + 49);
  if (pendingOnly) query = query.eq("status", "pending");
  if (restaurantId) query = query.eq("restaurant_id", restaurantId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as PlaceClaim[];
}
export async function listClaimEvents(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("claim_events")
    .select("id, claim_id, action, note, created_at")
    .order("id", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as {
    id: number;
    claim_id: string;
    action: string;
    note: string;
    created_at: string;
  }[];
}
export async function reviewPlaceClaim(
  supabase: SupabaseClient,
  input: {
    claim: string;
    revision: number;
    decision: "approved" | "rejected";
    note: string;
    transfer: boolean;
  },
) {
  const { error } = await supabase.rpc("review_place_claim", {
    claim: input.claim,
    expected_revision: input.revision,
    decision: input.decision,
    review_note: input.note,
    allow_transfer: input.transfer,
  });
  if (error) throw error;
}
