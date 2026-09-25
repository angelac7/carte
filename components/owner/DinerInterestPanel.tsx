import type { DinerInterest } from "@/lib/db/owner-stats";

function Top({ title, rows, empty }: { title: string; rows: DinerInterest[]; empty: string }) {
  const most = Math.max(1, ...rows.map((row) => row.uses));
  return (
    <div>
      <h3 className="eyebrow text-muted">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.slice(0, 5).map((row) => (
            <li key={row.value}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="truncate font-medium">{row.value}</span>
                <span className="text-muted tabular-nums">{row.uses}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full shadow-pressed-sm">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(row.uses / most) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** What diners filtered for and couldn't find on the menu, as anonymous monthly totals. */
export function DinerInterestPanel({ interest }: { interest: DinerInterest[] }) {
  const of = (kind: DinerInterest["kind"]) => interest.filter((row) => row.kind === kind);
  return (
    <section className="rounded-panel bg-paper p-6 shadow-raised sm:p-8">
      <h2 className="font-serif text-3xl tracking-tight">What diners look for</h2>
      <p className="mt-1 text-sm text-muted">
        The last 30 days, counted once per visit. Nothing about who searched is kept.
      </p>
      <div className="mt-6 grid gap-8 sm:grid-cols-3">
        <Top title="Allergies they avoid" rows={of("avoid")} empty="No allergy filters yet." />
        <Top title="Diets they want" rows={of("diet")} empty="No diet filters yet." />
        <Top
          title="Searched, not found"
          rows={of("missed_search")}
          empty="Nothing yet. A search shows here once more than one visit looks for it."
        />
      </div>
    </section>
  );
}
