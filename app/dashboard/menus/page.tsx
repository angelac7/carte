import {
  createGroupAction,
  deleteGroupAction,
  renameGroupAction,
  setGroupDishesAction,
  switchGroupAction,
} from "@/app/dashboard/menus/actions";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { requireRestaurant } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { listDishes } from "@/lib/db";
import { listDishGroups } from "@/lib/db/dish-groups";
import { fmt, plural } from "@/lib/i18n/owner/format";
import { ownerStrings, ownerTitle } from "@/lib/owner-language";

export const dynamic = "force-dynamic";
export const generateMetadata = () => ownerTitle((t) => t.menus.title);

const panelClass = "mt-8 rounded-panel bg-paper p-6 shadow-raised sm:p-8";

export default async function SeasonalMenusPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const { supabase, restaurant } = await requireRestaurant("/dashboard/menus");
  const { t, language } = await ownerStrings();
  const m = t.menus;
  const [groups, dishes, { result }] = await Promise.all([
    listDishGroups(supabase, restaurant.id),
    listDishes(supabase, restaurant.id),
    searchParams,
  ]);
  const groupName = new Map(groups.map((group) => [group.id, group.name]));

  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader title={m.title} intro={m.intro} />

      {result === "name" && (
        <Notice tone="warning" role="alert" className="mt-6">
          {m.errorName}
        </Notice>
      )}
      {result === "failed" && (
        <Notice tone="warning" role="alert" className="mt-6">
          {m.failed}
        </Notice>
      )}

      <form action={createGroupAction} className={cn(panelClass, "flex flex-wrap items-end gap-3")}>
        <label className="min-w-0 flex-1">
          <span className={labelClass}>{m.newLabel}</span>
          <input
            name="name"
            required
            maxLength={60}
            placeholder={m.placeholder}
            className={fieldClass("mt-1")}
          />
        </label>
        <Button type="submit">{m.create}</Button>
      </form>

      {groups.length === 0 && <p className="mt-8 text-muted">{m.empty}</p>}

      {groups.map((group) => {
        const count = dishes.filter((dish) => dish.group_id === group.id).length;
        return (
          <section key={group.id} className={panelClass} aria-labelledby={`group-${group.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id={`group-${group.id}`} className="font-serif text-3xl tracking-tight">
                  {group.name}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  <span
                    className={cn(
                      "me-2 rounded-full px-2.5 py-1 text-xs font-medium",
                      group.active ? "bg-basil-soft text-basil" : "bg-ink/10 text-ink",
                    )}
                  >
                    {group.active ? m.on : m.off}
                  </span>
                  {group.active ? m.onText : m.offText} · {plural(m.dishCount, count, language)}
                </p>
              </div>
              <form action={switchGroupAction}>
                <input type="hidden" name="group" value={group.id} />
                <input type="hidden" name="active" value={String(!group.active)} />
                <Button type="submit" variant={group.active ? "secondary" : "primary"} size="sm">
                  {group.active ? m.switchOff : m.switchOn}
                </Button>
              </form>
            </div>

            <details className="mt-6">
              <summary className="cursor-pointer font-medium">{m.choose}</summary>
              <form action={setGroupDishesAction} className="mt-4">
                <input type="hidden" name="group" value={group.id} />
                <fieldset>
                  <legend className="sr-only">{m.choose}</legend>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {dishes.map((dish) => (
                      <li key={dish.id}>
                        <label className="flex items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            name="dish"
                            value={dish.id}
                            defaultChecked={dish.group_id === group.id}
                            className="mt-1"
                          />
                          <span>
                            {dish.name}
                            {dish.group_id && dish.group_id !== group.id && (
                              <span className="text-muted">
                                {" "}
                                ({fmt(m.inOther, { name: groupName.get(dish.group_id) ?? "" })})
                              </span>
                            )}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
                <Button type="submit" size="sm" className="mt-4">
                  {m.save}
                </Button>
              </form>
            </details>

            <details className="mt-4">
              <summary className="cursor-pointer font-medium">{m.rename}</summary>
              <form action={renameGroupAction} className="mt-3 flex flex-wrap items-end gap-3">
                <input type="hidden" name="group" value={group.id} />
                <label className="min-w-0 flex-1">
                  <span className="sr-only">{m.rename}</span>
                  <input
                    name="name"
                    required
                    maxLength={60}
                    defaultValue={group.name}
                    className={fieldClass()}
                  />
                </label>
                <Button type="submit" size="sm" variant="secondary">
                  {m.saveName}
                </Button>
              </form>
            </details>

            <form action={deleteGroupAction} className="mt-6 flex flex-wrap items-center gap-3">
              <input type="hidden" name="group" value={group.id} />
              <Button type="submit" size="sm" variant="danger">
                {m.remove}
              </Button>
              <span className="text-sm text-muted">{m.removeHint}</span>
            </form>
          </section>
        );
      })}
    </main>
  );
}
