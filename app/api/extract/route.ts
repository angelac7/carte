import { NextResponse } from "next/server";
import { streamMenuDishes } from "@/lib/ai/extract";
import { getOwnerContext } from "@/lib/auth";
import { ndjsonResponse } from "@/lib/ndjson-response";
import { checkRateLimit } from "@/lib/rate-limit";
import type { SupportedImageType } from "@/lib/upload-rules";
import { readImageUpload } from "@/lib/read-image-upload";
import type { MenuStreamEvent } from "@/types/menu-stream";
import { reportError } from "@/lib/report-error";
import { ownerStrings } from "@/lib/owner-language";
import { allowAiCall } from "@/lib/ai-budget";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const owner = await getOwnerContext();
  const { t } = await ownerStrings();
  if (!owner) return fail(t.api.loginUpload, 401);
  if (!(await checkRateLimit(`extract:${owner.user.id}`, 30, 60 * 60 * 1000))) {
    return fail(t.api.tooManyMenus, 429);
  }

  const form = await req.formData().catch(() => null);
  const image = await readImageUpload(form?.get("menu"), t.api.image);
  if (!image.ok) return fail(image.message, image.status);
  if (!(await allowAiCall("menu-upload", owner.restaurant.id)))
    return fail(t.api.tooManyMenus, 429);
  return ndjsonResponse(readMenu(image.base64, image.mediaType, req.signal, t.api));
}

/** Sends each dish to the browser as soon as it's read, then "done" or an error. */
async function* readMenu(
  imageBase64: string,
  mediaType: SupportedImageType,
  signal: AbortSignal,
  messages: { unreadable: string; partial: string },
): AsyncGenerator<MenuStreamEvent> {
  let count = 0;
  try {
    for await (const dish of streamMenuDishes(imageBase64, mediaType, signal)) {
      count++;
      yield { type: "dish", dish };
    }
    yield count > 0 ? { type: "done" } : { type: "error", message: messages.unreadable };
  } catch (err) {
    reportError("Menu extraction failed", err);
    yield { type: "error", message: count > 0 ? messages.partial : messages.unreadable };
  }
}
