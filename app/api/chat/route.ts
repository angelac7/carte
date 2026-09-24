import { NextResponse } from "next/server";
import { z } from "zod";
import { streamMenuAnswer } from "@/lib/ai/chat";
import { getConfirmedDishes, getRestaurantBySlug } from "@/lib/db";
import { filterDishes } from "@/lib/menu-filters";
import { languageName } from "@/lib/languages";
import { ndjsonResponse } from "@/lib/ndjson-response";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { isValidSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { ChatRequestSchema, type ChatMessage, type ChatStreamEvent } from "@/types/chat";
import type { MenuItem } from "@/types/menu";

const QUESTIONS_PER_WINDOW = 20;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const ChatBody = ChatRequestSchema.extend({ restaurant: z.string().refine(isValidSlug) });

/** Answers a diner's menu question from that restaurant's confirmed dishes only. */
export async function POST(req: Request) {
  if (!checkRateLimit(`chat:${clientKey(req)}`, QUESTIONS_PER_WINDOW, WINDOW_MS)) {
    return NextResponse.json({ error: "limit" }, { status: 429 });
  }

  const parsed = ChatBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    const supabase = await createClient();
    const restaurant = await getRestaurantBySlug(supabase, parsed.data.restaurant);
    if (!restaurant) return NextResponse.json({ error: "not found" }, { status: 404 });

    const dishes = filterDishes(await getConfirmedDishes(supabase, restaurant.id), parsed.data);
    const { language, messages } = parsed.data;
    return ndjsonResponse(answer(dishes, languageName(language), messages, req.signal));
  } catch (err) {
    console.error("Menu chat failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}

/** Sends the answer to the browser as it's written, then "done" or an error. */
async function* answer(
  dishes: MenuItem[],
  language: string,
  messages: ChatMessage[],
  signal: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
  let wrote = false;
  try {
    for await (const text of streamMenuAnswer(dishes, language, messages, signal)) {
      wrote ||= text.trim() !== "";
      yield { type: "text", text };
    }
    yield wrote ? { type: "done" } : { type: "error" };
  } catch (err) {
    console.error("Menu chat failed:", err);
    yield { type: "error" };
  }
}
