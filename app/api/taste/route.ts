import { NextResponse } from "next/server";
import { createTasteProfile } from "@/lib/ai/taste";
import { languageName } from "@/lib/languages";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { TasteRequestSchema } from "@/types/taste";

/** Creates a taste profile from data the diner sends from their own device. Nothing is stored. */
export async function POST(req: Request) {
  if (!checkRateLimit(`taste:${clientKey(req)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "limit" }, { status: 429 });
  }
  const parsed = TasteRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    const profile = await createTasteProfile(parsed.data, languageName(parsed.data.language));
    return NextResponse.json({ profile });
  } catch (err) {
    console.error("Taste profile failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
