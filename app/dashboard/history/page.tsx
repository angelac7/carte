import type { Metadata } from "next";
import { restoreVersionAction } from "@/app/dashboard/history/actions";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { emailsFor } from "@/lib/account";
import { requireRestaurant } from "@/lib/auth";
import { listDishHistory } from "@/lib/db/dish-history";
import {
  ACTION_LABELS,
  describeChange,
  latestEntryIds,
  withPrevious,
  type DishSafety,
} from "@/lib/dish-history";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Allergen history | Carte" };

const list = (values: string[]) => values.join(", ") || "none";

/** Where a dish's allergen information stands, for entries with nothing earlier to compare to. */
function Summary({ safety }: { safety: DishSafety }) {
  return (
    <p className="mt-1 text-sm text-muted">
      Contains: {list(safety.allergens)}
      {safety.may_contain.length > 0 && ` · May contain: ${list(safety.may_contain)}`}
      {safety.removable.length > 0 && ` · Can leave out: ${list(safety.removable)}`}
    </p>
  );
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ restored?: string; failed?: string }>;
}) {
  const { supabase, user, restaurant } = await requireRestaurant("/dashboard/history");
  const params = await searchParams;
  const entries = await listDishHistory(supabase, restaurant.id);
  const people = [...new Set(entries.map((e) => e.changed_by).filter((id): id is string => !!id))];
  const emails = await emailsFor(people.filter((id) => id !== user.id)).catch(
    () => new Map<string, string>(),
  );
  const latest = latestEntryIds(entries);
  const deletedDishes = new Set(
    entries.filter((e) => latest.has(e.id) && e.action === "deleted").map((e) => e.menu_item_id),
  );
  const when = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: restaurant.timezone,
  });
  const who = (id: string | null) =>
    id === null ? "" : id === user.id ? "you" : emails.get(id) || "someone on your team";

  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader
        title="Allergen history"
        intro="Every change to a dish's allergens, and every confirmation, with who made it and when. Carte keeps this record itself, so it can't be edited."
      >
        <ButtonLink href="/dashboard/review" variant="secondary">
          Review dishes
        </ButtonLink>
      </OwnerPageHeader>

      {params.restored && (
        <Notice tone="success" className="mt-8">
          The earlier allergens are back. The dish is unconfirmed now, so diners won&apos;t see it
          until you check and confirm it in Review dishes.
        </Notice>
      )}
      {params.failed && (
        <Notice tone="warning" role="alert" className="mt-8">
          That version couldn&apos;t be restored. The dish may have been deleted.
        </Notice>
      )}

      {entries.length === 0 ? (
        <p className="mt-10 text-muted">No changes yet.</p>
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
                      · {ACTION_LABELS[entry.action]}
                      {who(entry.changed_by) && ` by ${who(entry.changed_by)}`}
                    </span>
                  </p>
                  <time dateTime={entry.changed_at} className="text-sm text-muted tabular-nums">
                    {when.format(new Date(entry.changed_at))}
                  </time>
                </div>
                {changes.length > 0 ? (
                  <ul className="mt-1 space-y-0.5 text-sm">
                    {changes.map((line) => (
                      <li key={line.label}>
                        <span className="text-muted">{line.label}:</span>{" "}
                        {line.added.length > 0 && (
                          <span className="font-medium text-tomato">+ {line.added.join(", ")}</span>
                        )}
                        {line.added.length > 0 && line.removed.length > 0 && " "}
                        {line.removed.length > 0 && (
                          <span className="font-medium">− {line.removed.join(", ")}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Summary safety={entry.safety} />
                )}
                {canRestore && (
                  <form action={restoreVersionAction} className="mt-2">
                    <input type="hidden" name="entry" value={entry.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Go back to this version
                    </Button>
                  </form>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {entries.length === 200 && (
        <p className="mt-4 text-sm text-muted">Showing the latest 200 changes.</p>
      )}
    </main>
  );
}
