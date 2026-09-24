"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DishHeader } from "@/components/DishHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { ToggleChip } from "@/components/ToggleChip";
import { ALLERGENS, DIETARY_TAGS, type Allergen, type DietaryTag } from "@/lib/allergens";
import { deleteDish, fetchDishes, updateDish } from "@/lib/api-client";
import { toggleValue } from "@/lib/toggle-value";
import type { MenuItem } from "@/types/menu";

type Filter = "all" | "review" | "confirmed";

export default function ReviewPage() {
  const [dishes, setDishes] = useState<MenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [problem, setProblem] = useState("");

  useEffect(() => {
    fetchDishes()
      .then(setDishes)
      .catch(() =>
        setProblem("Your dishes couldn't be loaded. Check that Carte is running, then refresh."),
      )
      .finally(() => setLoaded(true));
  }, []);

  function showLocally(updated: MenuItem) {
    setDishes((prev) => prev.map((dish) => (dish.id === updated.id ? updated : dish)));
  }

  function save(updated: MenuItem) {
    showLocally(updated);
    updateDish(updated).catch(() =>
      setProblem("A change wasn't saved. Check that Carte is running, then try again."),
    );
  }

  // Any edit un-confirms the dish until the owner confirms it again.
  const toggleAllergen = (dish: MenuItem, allergen: Allergen) =>
    save({ ...dish, allergens: toggleValue(dish.allergens, allergen), confirmed: false });

  const toggleTag = (dish: MenuItem, tag: DietaryTag) =>
    save({ ...dish, dietary_tags: toggleValue(dish.dietary_tags, tag), confirmed: false });

  const confirmDish = (dish: MenuItem) => save({ ...dish, confirmed: true });

  function removeDish(dish: MenuItem) {
    if (!window.confirm(`Delete ${dish.name} from your menu?`)) return;
    setDishes((prev) => prev.filter((d) => d.id !== dish.id));
    deleteDish(dish.id).catch(() =>
      setProblem("That dish wasn't deleted. Check that Carte is running, then refresh."),
    );
  }

  const total = dishes.length;
  const done = dishes.filter((dish) => dish.confirmed).length;
  const shown = dishes.filter((dish) =>
    filter === "all" ? true : filter === "confirmed" ? dish.confirmed : !dish.confirmed,
  );
  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: total },
    { key: "review", label: "Needs review", count: total - done },
    { key: "confirmed", label: "Confirmed", count: done },
  ];

  return (
    <main className="mx-auto max-w-3xl px-5 pb-16">
      <div className="pt-12">
        <h1 className="font-serif text-4xl leading-tight">Review dishes</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-muted">
          Check the allergens for each dish and confirm it. Diners only see dishes you’ve confirmed.
        </p>
      </div>

      {problem && (
        <p role="alert" className="mt-6 rounded-md bg-tomato/10 px-4 py-3 text-sm text-tomato">
          {problem}
        </p>
      )}

      {loaded && total === 0 && !problem && (
        <div className="mt-10 rounded-lg border border-dashed border-line bg-card px-6 py-12">
          <h2 className="font-serif text-2xl">No dishes yet</h2>
          <p className="mt-2 text-muted">
            Upload a photo of your menu and Carte will list every dish here for you to confirm.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
          >
            Upload menu
          </Link>
        </div>
      )}

      {total > 0 && (
        <>
          <div className="sticky top-14 z-10 -mx-5 mt-8 border-b border-line bg-paper/95 px-5 py-4 backdrop-blur">
            <ProgressBar done={done} total={total} />
            <div className="mt-4 flex gap-2">
              {filters.map((f) => (
                <button
                  key={f.key}
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    filter === f.key
                      ? "bg-ink text-white"
                      : "text-muted hover:bg-card hover:text-ink"
                  }`}
                >
                  {f.label} <span className="tabular-nums opacity-70">{f.count}</span>
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 && (
            <p className="mt-10 text-muted">
              {filter === "review"
                ? "Every dish is confirmed."
                : "No dishes confirmed yet. Review a dish and confirm it to see it here."}
            </p>
          )}

          <div className="mt-6 space-y-5">
            {shown.map((dish) => (
              <article
                key={dish.id}
                className={`rounded-lg border border-l-4 border-line bg-card p-5 sm:p-6 ${
                  dish.confirmed ? "border-l-basil" : "border-l-saffron"
                }`}
              >
                <DishHeader name={dish.name} price={dish.price} as="h2" />
                <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
                  {dish.description}
                </p>

                <fieldset className="mt-5">
                  <legend className="text-sm font-medium">Contains</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ALLERGENS.map((allergen) => (
                      <ToggleChip
                        key={allergen}
                        label={allergen}
                        tone="ink"
                        pressed={dish.allergens.includes(allergen)}
                        onToggle={() => toggleAllergen(dish, allergen)}
                      />
                    ))}
                  </div>
                </fieldset>

                <fieldset className="mt-4">
                  <legend className="text-sm font-medium">Suitable for</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DIETARY_TAGS.map((tag) => (
                      <ToggleChip
                        key={tag}
                        label={tag}
                        tone="basil"
                        pressed={dish.dietary_tags.includes(tag)}
                        onToggle={() => toggleTag(dish, tag)}
                      />
                    ))}
                  </div>
                </fieldset>

                <label className="mt-4 block">
                  <span className="text-sm font-medium">Kitchen notes</span>
                  <textarea
                    rows={2}
                    maxLength={2000}
                    className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm placeholder:text-muted/70 focus:border-ink focus:outline-none"
                    placeholder="For example: fried in a shared fryer, sauce can be left off"
                    value={dish.notes}
                    onChange={(e) =>
                      showLocally({ ...dish, notes: e.target.value, confirmed: false })
                    }
                    onBlur={() => save(dish)}
                  />
                </label>

                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  {dish.confirmed ? (
                    <p className="text-sm font-medium text-basil">✓ Confirmed</p>
                  ) : (
                    <button
                      onClick={() => confirmDish(dish)}
                      className="rounded-md bg-basil px-4 py-2 text-sm font-medium text-white hover:bg-basil/90"
                    >
                      Confirm dish
                    </button>
                  )}
                  <button
                    onClick={() => removeDish(dish)}
                    className="text-sm text-muted hover:text-tomato"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
