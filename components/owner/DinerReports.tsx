import { resolveReportAction } from "@/app/dashboard/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { plural } from "@/lib/i18n/owner/format";
import type { OwnerStrings } from "@/lib/i18n/owner-strings";
import { htmlLang, type LanguageCode } from "@/lib/languages";
import { timeAgo } from "@/lib/time-ago";
import type { DishReport } from "@/types/report";

/** Diners' reports that a dish's details look wrong, until the owner marks them fixed. */
export function DinerReports({
  reports,
  now,
  t,
  language,
}: {
  reports: DishReport[];
  now: Date;
  t: OwnerStrings;
  language: LanguageCode;
}) {
  return (
    <section className="rounded-panel border border-saffron/50 bg-saffron-soft p-6 shadow-raised sm:p-8">
      <h2 className="font-serif text-3xl tracking-tight">
        {plural(t.reports.title, reports.length, language)}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-saffron-ink">{t.reports.intro}</p>
      <ul className="mt-5 space-y-3">
        {reports.map((report) => (
          <li
            key={report.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-control bg-paper p-4 shadow-raised-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{report.dish_name}</p>
              <p className="text-sm text-saffron-ink">{t.reports.kinds[report.kind]}</p>
              {report.message && (
                <p className="mt-1 text-sm break-words text-muted">“{report.message}”</p>
              )}
              <p className="mt-1 text-xs text-muted">
                {timeAgo(new Date(report.created_at), now, htmlLang(language), t.common.justNow)}
              </p>
            </div>
            <form action={resolveReportAction}>
              <input type="hidden" name="id" value={report.id} />
              <Button type="submit" variant="secondary" size="sm">
                {t.reports.markFixed}
              </Button>
            </form>
          </li>
        ))}
      </ul>
      <ButtonLink href="/dashboard/review" variant="ghost" className="mt-4">
        {t.reports.goReview}
      </ButtonLink>
    </section>
  );
}
