import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerContext } from "@/lib/auth";
import { listDishes } from "@/lib/db";
import { applyImportPreview, saveImportPreview } from "@/lib/db/menu-import";
import { checkRateLimit } from "@/lib/rate-limit";
import { IMPORT_STRINGS } from "@/lib/i18n/import-strings";
import { menuToCsv, planImport, readImport } from "@/lib/menu-csv";
import { ownerStrings } from "@/lib/owner-language";
import { reportError } from "@/lib/report-error";

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/** The whole menu as a spreadsheet file. */
export async function GET() {
  const owner = await getOwnerContext();
  const { t } = await ownerStrings();
  if (!owner) return fail(t.api.loginMenu, 401);
  // The menu as diners know it: a draft waiting to be published stays out of the file.
  const dishes = await listDishes(owner.supabase, owner.restaurant.id);
  const csv = menuToCsv(dishes.filter((dish) => !dish.draft));
  const name = `${owner.restaurant.slug}-menu.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}

const ImportRequest = z.object({
  csv: z.string().max(1_000_000),
  /** False shows what would change; true makes the changes. */
  apply: z.boolean(),
  previewId: z.uuid().optional(),
});

/**
 * Imports an edited spreadsheet. Changed and new dishes are unconfirmed, so nothing reaches
 * diners until the owner checks it; dishes missing from the file are left alone.
 */
export async function POST(req: Request) {
  const owner = await getOwnerContext();
  const { t, language } = await ownerStrings();
  if (!owner) return fail(t.api.loginMenu, 401);
  const parsed = ImportRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(t.api.badFile);
  const messages = IMPORT_STRINGS[language];
  if (!(await checkRateLimit(`menu-import:${owner.user.id}`, 120, 60 * 60 * 1000)))
    return fail(messages.limited, 429);
  if (parsed.data.apply) {
    if (!parsed.data.previewId) return fail(messages.stale, 409);
    try {
      const summary = await applyImportPreview(
        owner.supabase,
        owner.restaurant.id,
        parsed.data.previewId,
      );
      return NextResponse.json({ ...summary, applied: true, conflicts: [] });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "40001" || code === "22023") return fail(messages.stale, 409);
      reportError("Spreadsheet import failed", error);
      return fail(t.api.importStopped, 500);
    }
  }
  const { rows, problems } = readImport(parsed.data.csv, t.spreadsheet.problems);
  const existing = await listDishes(owner.supabase, owner.restaurant.id);
  const plan = planImport(rows, existing);
  const summary = {
    added: plan.add.map((row) => row.name),
    changed: plan.change.map(({ updated, fields }) => ({ name: updated.name, fields })),
    unchanged: plan.unchanged,
    problems,
  };
  if (problems.length || (!plan.add.length && !plan.change.length))
    return NextResponse.json(summary);
  const previewId = await saveImportPreview(
    owner.supabase,
    owner.restaurant.id,
    existing,
    plan,
    summary,
  );
  return NextResponse.json({ ...summary, previewId });
}
