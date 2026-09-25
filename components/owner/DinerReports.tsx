import { resolveReportAction } from "@/app/dashboard/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { timeAgo } from "@/lib/time-ago";
import type { DishReport, ReportKind } from "@/types/report";

const KIND_LABELS: Record<ReportKind, string> = {
  allergens: "Allergens look wrong",
  diet: "Diet label looks wrong",
  description: "Description looks wrong",
  price: "Price looks wrong",
  other: "Something else",
};

/** Diners' reports that a dish's details look wrong, until the owner marks them fixed. */
export function DinerReports({ reports, now }: { reports: DishReport[]; now: Date }) {
  return (
    <section className="rounded-panel border border-saffron/50 bg-saffron-soft p-6 shadow-raised sm:p-8">
      <h2 className="font-serif text-3xl tracking-tight">
        {reports.length === 1 ? "1 diner report" : `${reports.length} diner reports`}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-saffron-ink">
        Diners think these details may be wrong. Check each dish, correct it in Review dishes if
        needed, then mark the report fixed.
      </p>
      <ul className="mt-5 space-y-3">
        {reports.map((report) => (
          <li
            key={report.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-control bg-paper p-4 shadow-raised-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{report.dish_name}</p>
              <p className="text-sm text-saffron-ink">{KIND_LABELS[report.kind]}</p>
              {report.message && (
                <p className="mt-1 text-sm break-words text-muted">“{report.message}”</p>
              )}
              <p className="mt-1 text-xs text-muted">{timeAgo(new Date(report.created_at), now)}</p>
            </div>
            <form action={resolveReportAction}>
              <input type="hidden" name="id" value={report.id} />
              <Button type="submit" variant="secondary" size="sm">
                Mark fixed
              </Button>
            </form>
          </li>
        ))}
      </ul>
      <ButtonLink href="/dashboard/review" variant="ghost" className="mt-4">
        Go to Review dishes
      </ButtonLink>
    </section>
  );
}
