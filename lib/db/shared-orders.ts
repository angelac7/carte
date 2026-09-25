import "server-only";
import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type OrderLines = Record<string, number>;

// Letters and digits that can't be mistaken for each other when read aloud or typed.
const CODE_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/** A hard-to-guess code for a table's shared order link. */
export function newTableCode(): string {
  return Array.from({ length: 10 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

/**
 * Starts a shared order. The database keeps only confirmed dishes from this restaurant.
 * Called only by Carte's server, after rate limits; visitors can't reach the table directly.
 */
export async function createSharedOrder(
  restaurantId: string,
  initial: OrderLines,
): Promise<{ code: string; lines: OrderLines }> {
  const code = newTableCode();
  const { data, error } = await createAdminClient().rpc("create_shared_order", {
    restaurant: restaurantId,
    code,
    initial,
  });
  if (error) throw error;
  return { code, lines: (data ?? {}) as OrderLines };
}

export async function getSharedOrder(
  code: string,
): Promise<{ restaurantId: string; lines: OrderLines } | null> {
  const { data, error } = await createAdminClient().rpc("get_shared_order", { code });
  if (error) throw error;
  const row = (data as { restaurant_id: string; lines: OrderLines }[] | null)?.[0];
  return row ? { restaurantId: row.restaurant_id, lines: row.lines } : null;
}

/** Sets one line's quantity; null when the shared order has ended. */
export async function setSharedLine(
  code: string,
  line: string,
  quantity: number,
): Promise<OrderLines | null> {
  const { data, error } = await createAdminClient().rpc("set_shared_line", {
    code,
    line,
    quantity,
  });
  if (error) throw error;
  return (data as OrderLines | null) ?? null;
}
