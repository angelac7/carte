import { createHash } from "crypto";
import type { MenuItem } from "@/types/menu";

/** A fingerprint of a dish's text, so any owner edit triggers a fresh translation. */
export function sourceHash(
  dish: Pick<MenuItem, "name" | "description" | "notes" | "source_language">,
): string {
  return createHash("sha256")
    .update(
      JSON.stringify([dish.name, dish.description, dish.notes, dish.source_language ?? "und"]),
    )
    .digest("hex");
}

/**
 * A fingerprint of everything a translation covers. Dishes without a section match their older
 * saved translations, so adding sections only retranslates the dishes that have one.
 */
export function translationHash(
  dish: Pick<
    MenuItem,
    "name" | "description" | "notes" | "source_language" | "section" | "sizes" | "addons"
  >,
): string {
  const options = optionLabels(dish);
  if (!dish.section && options.length === 0) return sourceHash(dish);
  return createHash("sha256")
    .update(
      JSON.stringify([
        dish.name,
        dish.description,
        dish.notes,
        dish.source_language ?? "und",
        dish.section ?? "",
        ...(options.length > 0 ? [options] : []),
      ]),
    )
    .digest("hex");
}

/** A dish's size names then add-on names, the order translations keep them in. */
export function optionLabels(dish: Pick<MenuItem, "sizes" | "addons">): string[] {
  return [...(dish.sizes ?? []), ...(dish.addons ?? [])].map((option) => option.label);
}
