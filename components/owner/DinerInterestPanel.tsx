import { isAllergen, isDietaryTag } from "@/lib/allergens";
import type { DinerInterest } from "@/lib/db/owner-stats";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import type { OwnerStrings } from "@/lib/i18n/owner-strings";
import type { LanguageCode } from "@/lib/languages";

function Top({
  title,
  rows,
  empty,
  name = (value) => value,
}: {
  title: string;
  rows: DinerInterest[];
  empty: string;
  name?: (value: string) => string;
}) {
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
                <span className="truncate font-medium">{name(row.value)}</span>
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
export function DinerInterestPanel({
  interest,
  t,
  language,
}: {
  interest: DinerInterest[];
  t: OwnerStrings;
  language: LanguageCode;
}) {
  const of = (kind: DinerInterest["kind"]) => interest.filter((row) => row.kind === kind);
  const d = DINER_STRINGS[language];
  return (
    <section className="rounded-panel bg-paper p-6 shadow-raised sm:p-8">
      <h2 className="font-serif text-3xl tracking-tight">{t.interest.title}</h2>
      <p className="mt-1 text-sm text-muted">{t.interest.intro}</p>
      <div className="mt-6 grid gap-8 sm:grid-cols-3">
        <Top
          title={t.interest.avoid}
          rows={of("avoid")}
          empty={t.interest.avoidEmpty}
          name={(value) => (isAllergen(value) ? d.allergens[value] : value)}
        />
        <Top
          title={t.interest.diets}
          rows={of("diet")}
          empty={t.interest.dietsEmpty}
          name={(value) => (isDietaryTag(value) ? d.tags[value] : value)}
        />
        <Top title={t.interest.missed} rows={of("missed_search")} empty={t.interest.missedEmpty} />
      </div>
    </section>
  );
}
