import { NextResponse } from "next/server";
import { z } from "zod";
import { answerMenuQuestion } from "@/lib/ai/chat";
import { getConfirmedDishes, getRestaurantBySlug } from "@/lib/db";
import { languageName } from "@/lib/languages";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { isValidSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { ChatRequestSchema } from "@/types/chat";

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

    const dishes = await getConfirmedDishes(supabase, restaurant.id);
    const { language, messages } = parsed.data;
    const reply = await answerMenuQuestion(dishes, languageName(language), messages);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Menu chat failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
