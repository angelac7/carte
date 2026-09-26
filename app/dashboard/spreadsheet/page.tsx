import type { Metadata } from "next";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { SpreadsheetImport } from "@/components/owner/SpreadsheetImport";
import { buttonClass } from "@/components/ui/button";
import { ALLERGENS, DIETARY_TAGS, OTHER_AVOIDS } from "@/lib/allergens";
import { requireRestaurant } from "@/lib/auth";

export const metadata: Metadata = { title: "Spreadsheet | Carte" };

const panelClass = "mt-8 rounded-panel bg-paper p-6 shadow-raised sm:p-8";

export default async function SpreadsheetPage() {
  await requireRestaurant("/dashboard/spreadsheet");
  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader
        title="Spreadsheet"
        intro="Download your menu, edit it in Excel or Google Sheets, and upload it again. Handy for changing lots of prices or allergens at once."
      />

      <section className={panelClass}>
        <h2 className="font-serif text-3xl tracking-tight">1. Download</h2>
        <p className="mt-2 text-sm text-muted">
          A CSV file with every dish. Keep the id column, so Carte knows which dish each row is.
          Rows without an id become new dishes.
        </p>
        {/* A plain link, so the browser saves the file. */}
        <a href="/api/menu-spreadsheet" download className={`mt-5 ${buttonClass()}`}>
          Download your menu
        </a>
      </section>

      <section className={panelClass}>
        <h2 className="font-serif text-3xl tracking-tight">2. Upload your changes</h2>
        <p className="mt-2 text-sm text-muted">
          You&apos;ll see what will change before anything is saved. Changed and new dishes need
          confirming again in Review dishes before diners see them. Dishes you delete from the file
          stay on your menu; delete them in Review dishes. Sizes and add-ons aren&apos;t in the
          spreadsheet.
        </p>
        <div className="mt-5">
          <SpreadsheetImport />
        </div>
      </section>

      <section className={panelClass}>
        <h2 className="font-serif text-3xl tracking-tight">Writing allergens and labels</h2>
        <p className="mt-2 text-sm text-muted">
          Separate several with semicolons, like <span className="font-mono">milk; wheat</span>. Use
          these words exactly:
        </p>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-medium">allergens, may_contain, can_leave_out</dt>
            <dd className="text-muted">{ALLERGENS.join(", ")}</dd>
          </div>
          <div>
            <dt className="font-medium">also_contains</dt>
            <dd className="text-muted">{OTHER_AVOIDS.join(", ")}</dd>
          </div>
          <div>
            <dt className="font-medium">diet_labels</dt>
            <dd className="text-muted">{DIETARY_TAGS.join(", ")}</dd>
          </div>
          <div>
            <dt className="font-medium">spice</dt>
            <dd className="text-muted">0 (not spicy) to 3 (hot), or empty</dd>
          </div>
          <div>
            <dt className="font-medium">special</dt>
            <dd className="text-muted">yes or no</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
