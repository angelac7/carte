import { NextResponse } from "next/server";
import { scanPaperMenu } from "@/lib/ai/scan-menu";
import { isLanguageCode, languageName } from "@/lib/languages";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { readImageUpload } from "@/lib/read-image-upload";

/** Reads and translates a paper menu from a restaurant that isn't on Carte. Nothing is stored. */
export async function POST(req: Request) {
  if (!checkRateLimit(`scan:${clientKey(req)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "limit" }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const language = String(form?.get("lang") ?? "");
  if (!isLanguageCode(language)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const image = await readImageUpload(form?.get("image"));
  if (!image.ok) return NextResponse.json({ error: image.message }, { status: image.status });

  try {
    const menu = await scanPaperMenu(image.base64, image.mediaType, languageName(language));
    return NextResponse.json({ menu });
  } catch (err) {
    console.error("Menu scan failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
