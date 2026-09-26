import { NextResponse } from "next/server";
import { streamMenuDishes } from "@/lib/ai/extract";
import { getOwnerContext } from "@/lib/auth";
import { ndjsonResponse } from "@/lib/ndjson-response";
import { checkRateLimit } from "@/lib/rate-limit";
import type { SupportedImageType } from "@/lib/upload-rules";
import { readImageUpload } from "@/lib/read-image-upload";
import type { MenuStreamEvent } from "@/types/menu-stream";
import { reportError } from "@/lib/report-error";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const owner = await getOwnerContext();
  if (!owner) return fail("Log in to upload a menu.", 401);
  if (!(await checkRateLimit(`extract:${owner.user.id}`, 30, 60 * 60 * 1000))) {
    return fail("Too many menu uploads in the last hour. Try again later.", 429);
  }

  const form = await req.formData().catch(() => null);
  const image = await readImageUpload(form?.get("menu"));
  if (!image.ok) return fail(image.message, image.status);
  return ndjsonResponse(readMenu(image.base64, image.mediaType, req.signal));
}

const UNREADABLE =
  "Carte couldn't read that image. Try a sharper, well-lit photo where the text is easy to see.";
const PARTIAL =
  "Carte stopped before reading the whole menu. Save the dishes below and upload the rest, or try again.";

/** Sends each dish to the browser as soon as it's read, then "done" or an error. */
async function* readMenu(
  imageBase64: string,
  mediaType: SupportedImageType,
  signal: AbortSignal,
): AsyncGenerator<MenuStreamEvent> {
  let count = 0;
  try {
    for await (const dish of streamMenuDishes(imageBase64, mediaType, signal)) {
      count++;
      yield { type: "dish", dish };
    }
    yield count > 0 ? { type: "done" } : { type: "error", message: UNREADABLE };
  } catch (err) {
    reportError("Menu extraction failed", err);
    yield { type: "error", message: count > 0 ? PARTIAL : UNREADABLE };
  }
}
