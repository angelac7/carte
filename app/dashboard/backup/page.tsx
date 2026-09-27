import { BackupRestore } from "@/components/owner/BackupRestore";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { buttonClass } from "@/components/ui/button";
import { requireRestaurant } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { ownerStrings, ownerTitle } from "@/lib/owner-language";

export const generateMetadata = () => ownerTitle((t) => t.backup.title);

const panelClass = "mt-8 rounded-panel bg-paper p-6 shadow-raised sm:p-8";

/** Downloads the whole menu as one file, and restores one as a draft. */
export default async function BackupPage() {
  await requireRestaurant("/dashboard/backup");
  const { t } = await ownerStrings();
  const b = t.backup;
  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader title={b.title} intro={b.intro} />
      <section className={panelClass}>
        <h2 className="font-serif text-2xl tracking-tight">{b.downloadTitle}</h2>
        {/* A plain link, so the browser saves the file itself. */}
        <a
          href="/api/backup"
          download
          className={cn(buttonClass({ variant: "secondary" }), "mt-4")}
        >
          {b.download}
        </a>
      </section>
      <section className={panelClass}>
        <h2 className="font-serif text-2xl tracking-tight">{b.restoreTitle}</h2>
        <p className="mt-1 text-sm text-muted">{b.restoreText}</p>
        <BackupRestore />
      </section>
    </main>
  );
}
