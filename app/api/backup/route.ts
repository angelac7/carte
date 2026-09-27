import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerContext } from "@/lib/auth";
import { buildBackup } from "@/lib/backup";
import { listDishes } from "@/lib/db";
import { DraftExistsError, restoreBackup } from "@/lib/db/backup";
import { listDishGroups } from "@/lib/db/dish-groups";
import { listCorrectedTranslations } from "@/lib/db/owner-translations";
import { getRestaurantProfile } from "@/lib/db/profile";
import { ownerStrings } from "@/lib/owner-language";
import { checkRateLimit } from "@/lib/rate-limit";
import { reportError } from "@/lib/report-error";
import { BackupSchema } from "@/types/backup";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5_000_000;

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/** Downloads everything about the signed-in owner's menu as one file. */
export async function GET() {
  const owner = await getOwnerContext();
  const { t } = await ownerStrings();
  if (!owner) return fail(t.api.loginMenu, 401);
  const { supabase, restaurant } = owner;
  const [profile, dishes, groups] = await Promise.all([
    getRestaurantProfile(supabase, restaurant.id),
    listDishes(supabase, restaurant.id),
    listDishGroups(supabase, restaurant.id),
  ]);
  const corrected = await listCorrectedTranslations(
    supabase,
    dishes.map((dish) => dish.id),
  );
  const backup = buildBackup(profile, dishes, groups, corrected);
  const day = backup.exported_at.slice(0, 10);
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="carte-backup-${restaurant.slug}-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

const RestoreRequest = z.object({ backup: z.unknown(), profile: z.boolean() });

/** Restores a backup as a draft, so the menu diners see only changes once the owner publishes. */
export async function POST(req: Request) {
  const owner = await getOwnerContext();
  const { t } = await ownerStrings();
  if (!owner) return fail(t.api.loginMenu, 401);
  if (!(await checkRateLimit(`backup-restore:${owner.user.id}`, 10, 60 * 60 * 1000)))
    return fail(t.backup.failed, 429);
  const text = await req.text();
  if (text.length > MAX_BYTES) return fail(t.backup.tooBig, 413);
  const request = RestoreRequest.safeParse(JSON.parse(text || "null"));
  const backup = BackupSchema.safeParse(request.success ? request.data.backup : null);
  if (!request.success || !backup.success) return fail(t.backup.badFile);
  try {
    const restored = await restoreBackup(
      owner.supabase,
      owner.restaurant.id,
      backup.data,
      request.data.profile,
    );
    return NextResponse.json({ restored });
  } catch (error) {
    if (error instanceof DraftExistsError) return fail(t.backup.draftExists, 409);
    reportError("Restoring a backup failed", error);
    return fail(t.backup.failed, 500);
  }
}
