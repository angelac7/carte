import type { SupabaseClient } from "@supabase/supabase-js";
import { randomInt } from "node:crypto";

export type TeamMember = { userId: string; since: string };
export type Invite = { code: string; expiresAt: string };

// Letters and digits that can't be mistaken for each other.
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function newInviteCode(): string {
  return Array.from({ length: 12 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

export const isInviteCode = (code: string) => /^[a-z2-9]{12}$/.test(code);

/** The editors helping with a restaurant. Only its owner can see them. */
export async function listTeam(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("restaurant_members")
    .select("user_id, created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at");
  if (error) throw error;
  return ((data ?? []) as { user_id: string; created_at: string }[]).map((row) => ({
    userId: row.user_id,
    since: row.created_at,
  }));
}

/** Invite links that haven't been used or expired yet. */
export async function listOpenInvites(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<Invite[]> {
  const { data, error } = await supabase
    .from("restaurant_invites")
    .select("code, expires_at")
    .eq("restaurant_id", restaurantId)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as { code: string; expires_at: string }[]).map((row) => ({
    code: row.code,
    expiresAt: row.expires_at,
  }));
}

export async function createInvite(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<string> {
  const code = newInviteCode();
  const { error } = await supabase
    .from("restaurant_invites")
    .insert({ code, restaurant_id: restaurantId });
  if (error) throw error;
  return code;
}

export async function cancelInvite(supabase: SupabaseClient, restaurantId: string, code: string) {
  const { error } = await supabase
    .from("restaurant_invites")
    .delete()
    .eq("code", code)
    .eq("restaurant_id", restaurantId);
  if (error) throw error;
}

export async function removeMember(supabase: SupabaseClient, restaurantId: string, userId: string) {
  const { error } = await supabase
    .from("restaurant_members")
    .delete()
    .eq("restaurant_id", restaurantId)
    .eq("user_id", userId);
  if (error) throw error;
}

/** The restaurant an invite is for, or null if it's unknown, used, or expired. */
export async function peekInvite(supabase: SupabaseClient, code: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("peek_invite", { invite: code });
  if (error) throw error;
  return (data as { restaurant_name: string }[] | null)?.[0]?.restaurant_name ?? null;
}

/** Joins the signed-in person to the invite's restaurant; null if the invite can't be used. */
export async function acceptInvite(supabase: SupabaseClient, code: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("accept_invite", { invite: code });
  if (error) throw error;
  return (data as string | null) ?? null;
}
