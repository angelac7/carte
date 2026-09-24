import { AI_SUGGESTED_TAGS, ALLERGENS } from "@/lib/allergens";
import { anthropic, MODEL } from "@/lib/ai/client";
import { createLineReader, parseJsonLine } from "@/lib/json-lines";
import type { SupportedImageType } from "@/lib/upload-rules";
import { ExtractedDishSchema, type ExtractedDish } from "@/types/menu";

// The caution rules come from testing real menus: early versions missed wheat in
// soy sauce and noodles, and milk in French-style sauces. Faster settings also missed
// wheat in gochujang and tree nuts in chestnut dishes.
// One dish per line lets Carte show each dish as soon as it's read.
const PROMPT = `You are reading a restaurant menu image.
List every dish and drink you can see, in menu order. If some writing is hard to read, give your best reading instead of skipping it or explaining.
Write one line per dish and nothing else: no introduction, notes, list brackets, or code fences. Each line is a JSON object like:
{"name":"","description":"","price":"","likely_allergens":[],"dietary_tags":[]}
description is one short phrase.
likely_allergens may only include: ${ALLERGENS.join(", ")}.
dietary_tags may include: ${AI_SUGGESTED_TAGS.join(", ")}.
These are guesses for the restaurant to confirm, so include an allergen
if it is commonly used in that dish or its sauces.
Soy sauce, miso, and gochujang usually contain wheat. Noodles (ramen, ramyun, udon, somyeon, pasta), bread, dumplings, batter, and breading usually contain wheat unless stated otherwise. Classic French sauces often contain milk. Chestnuts are tree nuts.
Only add a dietary tag like gluten-free or vegan if you are highly confident
from the listed ingredients. When unsure, leave the tag out.`;

function toDish(line: string): ExtractedDish | null {
  const parsed = ExtractedDishSchema.safeParse(parseJsonLine(line));
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
  // Medium effort: in testing it read hard menus as completely as the default,
  // with the first dish in about 2 seconds instead of 10 or more.
  const stream = anthropic.messages.stream(
    {
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium" },
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
    { signal },
  );
  const lines = createLineReader();
  try {
    for await (const event of stream) {
      if (event.type !== "content_block_delta" || event.delta.type !== "text_delta") continue;
      for (const line of lines.push(event.delta.text)) {
        const dish = toDish(line);
        if (dish) yield dish;
      }
    }
    for (const line of lines.flush()) {
      const dish = toDish(line);
      if (dish) yield dish;
    }
  } finally {
    // If the owner leaves early, stop the AI call instead of paying for the rest.
    if (!stream.ended) stream.abort();
  }
}
