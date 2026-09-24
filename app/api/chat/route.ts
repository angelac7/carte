import { NextResponse } from "next/server";
import { answerMenuQuestion } from "@/lib/ai/chat";
import { readItems } from "@/lib/db";
import { languageName } from "@/lib/languages";
import { confirmedOnly } from "@/lib/menu-filters";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { ChatRequestSchema } from "@/types/chat";

const QUESTIONS_PER_WINDOW = 20;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/** Answers a diner's menu question from confirmed dishes only. */
export async function POST(req: Request) {
  if (!checkRateLimit(`chat:${clientKey(req)}`, QUESTIONS_PER_WINDOW, WINDOW_MS)) {
    return NextResponse.json({ error: "limit" }, { status: 429 });
  }

  const parsed = ChatRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    const dishes = confirmedOnly(readItems());
    const { language, messages } = parsed.data;
    const reply = await answerMenuQuestion(dishes, languageName(language), messages);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Menu chat failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
