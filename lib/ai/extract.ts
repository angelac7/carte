import Anthropic from "@anthropic-ai/sdk";
import { ALLERGENS, DIETARY_TAGS } from "@/lib/allergens";
import type { SupportedImageType } from "@/lib/upload-rules";
import { ExtractedMenuSchema, type ExtractedDish } from "@/types/menu";

const MODEL = "claude-sonnet-5";
const client = new Anthropic();

// The caution rules come from testing real menus: early versions missed wheat in
// soy sauce and noodles, and milk in French-style sauces.
const PROMPT = `You are reading a restaurant menu image.
Return ONLY valid JSON, no other text, in this format:
{"items":[{"name":"","description":"","price":"","likely_allergens":[],"dietary_tags":[]}]}
likely_allergens may only include: ${ALLERGENS.join(", ")}.
dietary_tags may include: ${DIETARY_TAGS.join(", ")}.
These are guesses for the restaurant to confirm, so include an allergen
if it is commonly used in that dish or its sauces.
Soy sauce and miso usually contain wheat. Noodles (ramen, ramyun, udon, somyeon, pasta), bread, dumplings, batter, and breading usually contain wheat unless stated otherwise. Classic French sauces often contain milk.
Only add a dietary tag like gluten-free or vegan if you are highly confident
from the listed ingredients. When unsure, leave the tag out.`;

/** Reads a menu image and returns its dishes with suggested, unconfirmed allergens. */
export async function extractMenu(
  imageBase64: string,
  mediaType: SupportedImageType,
): Promise<ExtractedDish[]> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });

  const reply = message.content.map((block) => (block.type === "text" ? block.text : "")).join("");
  const json = reply.replace(/```json|```/g, "").trim();
  return ExtractedMenuSchema.parse(JSON.parse(json)).items;
}
