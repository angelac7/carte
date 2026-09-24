import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

const PROMPT = `You are reading a restaurant menu image.
Return ONLY valid JSON, no other text, in this format:
{"items":[{"name":"","description":"","price":"",
"likely_allergens":[],"dietary_tags":[]}]}
likely_allergens may only include: milk, eggs, fish, shellfish, tree nuts,
peanuts, wheat, soy, sesame.
dietary_tags may include: vegan, vegetarian, gluten-free.
These are guesses for the restaurant to confirm, so include an allergen
if it is commonly used in that dish or its sauces.
Soy sauce and miso usually contain wheat. Classic French sauces often contain milk.
Only add a dietary tag like gluten-free or vegan if you are highly confident
from the listed ingredients. When unsure, leave the tag out.`;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("menu") as File;
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");

    const msg = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64",
            media_type: file.type as "image/jpeg" | "image/png" | "image/webp",
            data } },
          { type: "text", text: PROMPT },
        ],
      }],
    });

    const text = msg.content.map(b => (b.type === "text" ? b.text : "")).join("");
    const clean = text.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(clean));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not read menu" }, { status: 500 });
  }
}