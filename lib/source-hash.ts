import { createHash } from "crypto";
import type { MenuItem } from "@/types/menu";

/** A fingerprint of a dish's text, so any owner edit triggers a fresh translation. */
export function sourceHash(dish: Pick<MenuItem, "name" | "description" | "notes">): string {
  return createHash("sha256")
    .update(JSON.stringify([dish.name, dish.description, dish.notes]))
    .digest("hex");
}
