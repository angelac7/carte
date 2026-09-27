import Link from "@/components/OfflineLink";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { SpreadsheetImport } from "@/components/owner/SpreadsheetImport";
import { buttonClass } from "@/components/ui/button";
import { ALLERGENS, DIETARY_TAGS, OTHER_AVOIDS } from "@/lib/allergens";
import { requireRestaurant } from "@/lib/auth";
import { ownerStrings, ownerTitle } from "@/lib/owner-language";

export const generateMetadata = () => ownerTitle((t) => t.spreadsheet.title);

const panelClass = "mt-8 rounded-panel bg-paper p-6 shadow-raised sm:p-8";

export default async function SpreadsheetPage() {
  await requireRestaurant("/dashboard/spreadsheet");
  const { t } = await ownerStrings();
  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader title={t.spreadsheet.title} intro={t.spreadsheet.intro} />

      <section className={panelClass}>
        <h2 className="font-serif text-3xl tracking-tight">{t.spreadsheet.downloadTitle}</h2>
        <p className="mt-2 text-sm text-muted">{t.spreadsheet.downloadText}</p>
        {/* A plain link, so the browser saves the file. */}
        <a href="/api/menu-spreadsheet" download className={`mt-5 ${buttonClass()}`}>
          {t.spreadsheet.download}
        </a>
        <p className="mt-4 text-sm">
          <Link href="/dashboard/backup" className="underline underline-offset-4 hover:text-accent">
            {t.spreadsheet.backupLink}
          </Link>
        </p>
      </section>

      <section className={panelClass}>
        <h2 className="font-serif text-3xl tracking-tight">{t.spreadsheet.uploadTitle}</h2>
        <p className="mt-2 text-sm text-muted">{t.spreadsheet.uploadText}</p>
        <div className="mt-5">
          <SpreadsheetImport />
        </div>
      </section>

      <section className={panelClass}>
        <h2 className="font-serif text-3xl tracking-tight">{t.spreadsheet.wordsTitle}</h2>
        <p className="mt-2 text-sm text-muted">{t.spreadsheet.wordsText}</p>
        <dl dir="ltr" className="mt-4 space-y-3 text-sm">
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
            <dd className="text-muted">{t.spreadsheet.spiceWords}</dd>
          </div>
          <div>
            <dt className="font-medium">special</dt>
            <dd className="text-muted">{t.spreadsheet.specialWords}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
