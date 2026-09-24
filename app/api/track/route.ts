import { NextResponse } from "next/server";
import { z } from "zod";
import { recordDishView } from "@/lib/db/stats";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

const Body = z.object({ dish: z.uuid() });

/** Counts a dish view for trending. Each visitor counts at most once per dish per hour. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const visitor = clientKey(req);
  const allowed =
    checkRateLimit(`track:${visitor}`, 60, 10 * 60 * 1000) &&
    checkRateLimit(`track:${visitor}:${parsed.data.dish}`, 1, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ ok: true });

  try {
    await recordDishView(parsed.data.dish);
  } catch (err) {
    console.error("Recording a dish view failed:", err);
  }
  return NextResponse.json({ ok: true });
}
