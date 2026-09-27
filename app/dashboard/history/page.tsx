import { restoreVersionAction } from "@/app/dashboard/history/actions";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { emailsFor } from "@/lib/account";
import { requireRestaurant } from "@/lib/auth";
import { listDishHistory } from "@/lib/db/dish-history";
import { isAllergen, isDietaryTag, isOtherAvoid } from "@/lib/allergens";
import {
  describeChange,
  latestEntryByDish,
  withPrevious,
  type DishSafety,
} from "@/lib/dish-history";
import { formatList } from "@/lib/format-list";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { fmt } from "@/lib/i18n/owner/format";
import type { OwnerStrings } from "@/lib/i18n/owner-strings";
import { htmlLang, type LanguageCode } from "@/lib/languages";
import { ownerStrings, ownerTitle } from "@/lib/owner-language";

export const dynamic = "force-dynamic";
export const generateMetadata = () => ownerTitle((t) => t.history.title);

/** List codes, like "tree nuts" or "pork", named in the owner's language. */
function namer(language: LanguageCode, none: string) {
  const d = DINER_STRINGS[language];
  const name = (value: string) =>
    isAllergen(value)
      ? d.allergens[value]
      : isDietaryTag(value)
        ? d.tags[value]
        : isOtherAvoid(value)
          ? d.alsoAvoid[value]
          : value;
  return (values: string[]) => (values.length ? formatList(values.map(name), language) : none);
}

/** Where a dish's allergen information stands, for entries with nothing earlier to compare to. */
function Summary({
  safety,
  t,
  list,
}: {
  safety: DishSafety;
  t: OwnerStrings;
  list: (values: string[]) => string;
}) {
  const f = t.history.fields;
  return (
    <p className="mt-1 text-sm text-muted">
      {f.allergens}: {list(safety.allergens)}
      {safety.may_contain.length > 0 && ` · ${f.may_contain}: ${list(safety.may_contain)}`}
      {safety.removable.length > 0 && ` · ${f.removable}: ${list(safety.removable)}`}
    </p>
  );
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const { supabase, user, restaurant } = await requireRestaurant("/dashboard/history");
  const params = await searchParams;
  const { t, language } = await ownerStrings();
  const list = namer(language, t.history.none);
  const entries = await listDishHistory(supabase, restaurant.id);
  const people = [...new Set(entries.map((e) => e.changed_by).filter((id): id is string => !!id))];
  const emails = await emailsFor(people.filter((id) => id !== user.id)).catch(
    () => new Map<string, string>(),
  );
  const latestByDish = latestEntryByDish(entries);
  const latest = new Set(latestByDish.values());
  const deletedDishes = new Set(
    entries.filter((e) => latest.has(e.id) && e.action === "deleted").map((e) => e.menu_item_id),
  );
  const notice = {
    restored: { tone: "success", text: t.history.restored },
    "check-addons": { tone: "warning", text: t.history.checkAddons },
    changed: { tone: "warning", text: t.history.changed },
    missing: { tone: "warning", text: t.history.failed },
  }[params.result ?? ""] as { tone: "success" | "warning"; text: string } | undefined;
  const when = new Intl.DateTimeFormat(htmlLang(language), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: restaurant.timezone,
  });
  const who = (id: string | null) =>
    id === null ? "" : id === user.id ? t.history.you : emails.get(id) || t.history.someone;

  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader title={t.history.title} intro={t.history.intro}>
        <ButtonLink href="/dashboard/review" variant="secondary">
          {t.history.review}
        </ButtonLink>
      </OwnerPageHeader>

      {notice && (
        <Notice
          tone={notice.tone}
          role={notice.tone === "warning" ? "alert" : undefined}
          className="mt-8"
        >
          {notice.text}
        </Notice>
      )}

      {entries.length === 0 ? (
        <p className="mt-10 text-muted">{t.history.empty}</p>
      ) : (
        <ol className="mt-10 divide-y divide-ink/10 rounded-panel bg-paper shadow-raised">
          {withPrevious(entries).map(({ entry, previous }) => {
            const changes = previous ? describeChange(previous.safety, entry.safety) : [];
            const canRestore =
              !latest.has(entry.id) &&
              entry.action !== "deleted" &&
              !deletedDishes.has(entry.menu_item_id);
            return (
              <li key={entry.id} className="px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p>
                    <span className="font-medium">{entry.dish_name}</span>{" "}
                    <span className="text-muted">
                      · {t.history.actions[entry.action]}
                      {who(entry.changed_by) &&
                        ` ${fmt(t.history.by, { who: who(entry.changed_by) })}`}
                    </span>
                  </p>
                  <time dateTime={entry.changed_at} className="text-sm text-muted tabular-nums">
                    {when.format(new Date(entry.changed_at))}
                  </time>
                </div>
                {changes.length > 0 ? (
                  <ul className="mt-1 space-y-0.5 text-sm">
                    {changes.map((line) => (
                      <li key={`${line.field}-${line.addon ?? ""}`}>
                        <span className="text-muted">
                          {line.field === "addon"
                            ? fmt(t.history.addonContains, { addon: line.addon ?? "" })
                            : t.history.fields[line.field]}
                          :
                        </span>{" "}
                        {line.added.length > 0 && (
                          <span className="font-medium text-tomato">+ {list(line.added)}</span>
                        )}
                        {line.added.length > 0 && line.removed.length > 0 && " "}
                        {line.removed.length > 0 && (
                          <span className="font-medium">− {list(line.removed)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Summary safety={entry.safety} t={t} list={list} />
                )}
                {canRestore && (
                  <form action={restoreVersionAction} className="mt-2">
                    <input type="hidden" name="entry" value={entry.id} />
                    <input
                      type="hidden"
                      name="latest"
                      value={latestByDish.get(entry.menu_item_id)}
                    />
                    <Button type="submit" variant="ghost" size="sm">
                      {t.history.goBack}
                    </Button>
                  </form>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {entries.length === 200 && <p className="mt-4 text-sm text-muted">{t.history.latest200}</p>}
    </main>
  );
}
