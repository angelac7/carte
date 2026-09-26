import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerContext } from "@/lib/auth";
import { addImportedDishes, listDishes, updateDish } from "@/lib/db";
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
  const csv = menuToCsv(await listDishes(owner.supabase, owner.restaurant.id));
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
});

/**
 * Imports an edited spreadsheet. Changed and new dishes are unconfirmed, so nothing reaches
 * diners until the owner checks it; dishes missing from the file are left alone.
 */
export async function POST(req: Request) {
  const owner = await getOwnerContext();
  const { t } = await ownerStrings();
  if (!owner) return fail(t.api.loginMenu, 401);
  const parsed = ImportRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(t.api.badFile);
  const { rows, problems } = readImport(parsed.data.csv, t.spreadsheet.problems);
  const existing = await listDishes(owner.supabase, owner.restaurant.id);
  const plan = planImport(rows, existing);
  const summary = {
    added: plan.add.map((row) => row.name),
    changed: plan.change.map(({ updated, fields }) => ({ name: updated.name, fields })),
    unchanged: plan.unchanged,
    problems,
  };
  // Nothing is imported while any row has a problem, so a half-read file can't change the menu.
  if (!parsed.data.apply || problems.length > 0) return NextResponse.json(summary);

  try {
    await addImportedDishes(owner.supabase, owner.restaurant.id, plan.add);
    const conflicts: string[] = [];
    for (const { updated } of plan.change) {
      const saved = await updateDish(owner.supabase, owner.restaurant.id, updated);
      if (!saved) conflicts.push(updated.name);
    }
    return NextResponse.json({ ...summary, applied: true, conflicts });
  } catch (err) {
    reportError("Spreadsheet import failed", err);
    return fail(t.api.importStopped, 500);
  }
}
