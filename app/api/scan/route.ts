import { NextResponse } from "next/server";
import { streamPaperMenu } from "@/lib/ai/scan-menu";
import { isLanguageCode, languageName } from "@/lib/languages";
import { ndjsonResponse } from "@/lib/ndjson-response";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { readImageUpload } from "@/lib/read-image-upload";
import type { SupportedImageType } from "@/lib/upload-rules";
import type { ScanStreamEvent } from "@/types/menu-stream";

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

  return ndjsonResponse(
    scanMenu(image.base64, image.mediaType, languageName(language), req.signal),
  );
}

/** Sends the menu's language, then each dish as soon as it's read, then "done" or an error. */
async function* scanMenu(
  imageBase64: string,
  mediaType: SupportedImageType,
  language: string,
  signal: AbortSignal,
): AsyncGenerator<ScanStreamEvent> {
  try {
    for await (const update of streamPaperMenu(imageBase64, mediaType, language, signal)) {
      yield "dish" in update
        ? { type: "dish", dish: update.dish }
        : { type: "language", menuLanguage: update.menuLanguage };
    }
    yield { type: "done" };
  } catch (err) {
    console.error("Menu scan failed:", err);
    yield { type: "error", message: "unavailable" };
  }
}
