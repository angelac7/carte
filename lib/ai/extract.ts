import { AI_SUGGESTED_TAGS, ALLERGENS } from "@/lib/allergens";
import { streamText } from "@/lib/ai/client";
import { jsonReply, list, object, oneOf, string } from "@/lib/ai/json-schema";
import { createListItemReader, parseJson } from "@/lib/json-stream";
import type { SupportedImageType } from "@/lib/upload-rules";
import { ExtractedDishSchema, type ExtractedDish } from "@/types/menu";

// The caution rules come from testing real menus: early versions missed wheat in
// soy sauce and noodles, and milk in French-style sauces. Faster settings also missed
// wheat in gochujang and tree nuts in chestnut dishes.
const PROMPT = `You are reading a restaurant menu image.
List every dish and drink you can see, in menu order. If some writing is hard to read, give your best reading instead of skipping it.
Preserve the original language of names and descriptions; never assume English.
source_language is the BCP 47 language code of the dish text (for example ja, es, ar, th). Use und for mixed or uncertain text.
description is one short phrase in that language.
likely_allergens may only include: ${ALLERGENS.join(", ")}.
dietary_tags may include: ${AI_SUGGESTED_TAGS.join(", ")}.
These are guesses for the restaurant to confirm, so include an allergen
if it is commonly used in that dish or its sauces.
Soy sauce, miso, and gochujang usually contain wheat. Noodles (ramen, ramyun, udon, somyeon, pasta), bread, dumplings, batter, and breading usually contain wheat unless stated otherwise. Classic French sauces often contain milk. Chestnuts are tree nuts.
Only add a dietary tag like gluten-free or vegan if you are highly confident
from the listed ingredients. When unsure, leave the tag out.
Return ONLY valid JSON, no other text, in this format:
{"items":[{"source_language":"","name":"","description":"","price":"","likely_allergens":[],"dietary_tags":[]}]}`;

// Structured output: every dish comes back in exactly this shape, and allergens and
// tags can only be values from Carte's own lists.
const MENU_SCHEMA = object({
  items: list(
    object({
      source_language: string,
      name: string,
      description: string,
      price: string,
      likely_allergens: list(oneOf(ALLERGENS)),
      dietary_tags: list(oneOf(AI_SUGGESTED_TAGS)),
    }),
  ),
});

function toDish(text: string): ExtractedDish | null {
  const parsed = ExtractedDishSchema.safeParse(parseJson(text));
  return parsed.success && parsed.data.name.trim() !== "" ? parsed.data : null;
}

/**
 * Reads a menu image and yields its dishes one at a time, as soon as each is read.
 * Allergens are suggestions for the owner to confirm. Stops the AI call if `signal` aborts.
 */
export async function* streamMenuDishes(
  imageBase64: string,
  mediaType: SupportedImageType,
  signal?: AbortSignal,
): AsyncGenerator<ExtractedDish> {
  const items = createListItemReader();
  const text = streamText(
    {
      // High effort: allergen suggestions are the part owners rely on most.
      max_tokens: 32000,
      output_config: jsonReply(MENU_SCHEMA, "high"),
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    },
    signal,
  );
  for await (const chunk of text) {
    for (const item of items.push(chunk)) {
      const dish = toDish(item);
      if (dish) yield dish;
    }
  }
}
