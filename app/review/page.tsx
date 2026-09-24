"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { MenuItem } from "@/lib/db";

const ALLERGENS = ["milk", "eggs", "fish", "shellfish", "tree nuts",
  "peanuts", "wheat", "soy", "sesame"];
const TAGS = ["vegan", "vegetarian", "gluten-free"];

type Filter = "all" | "review" | "confirmed";

async function persist(item: MenuItem) {
  await fetch("/api/items", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
}

export default function Review() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((data: MenuItem[]) => {
        setItems(data);
        setLoaded(true);
      });
  }, []);

  function change(updated: MenuItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  // Any edit un-confirms the dish until the owner confirms again
  function toggle(item: MenuItem, field: "allergens" | "dietary_tags", value: string) {
    const current = item[field];
    const list = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    const updated: MenuItem =
      field === "allergens"
        ? { ...item, allergens: list, confirmed: false }
        : { ...item, dietary_tags: list, confirmed: false };
    change(updated);
    persist(updated);
  }

  function confirmDish(item: MenuItem) {
    const updated = { ...item, confirmed: true };
    change(updated);
    persist(updated);
  }

  async function remove(item: MenuItem) {
    if (!window.confirm(`Delete ${item.name} from your menu?`)) return;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await fetch("/api/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
  }

  const total = items.length;
  const done = items.filter((i) => i.confirmed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const shown = items.filter((i) =>
    filter === "all" ? true : filter === "confirmed" ? i.confirmed : !i.confirmed
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
          Check the allergens for each dish and confirm it. Diners only see dishes you’ve
          confirmed.
        </p>
      </div>

      {loaded && total === 0 && (
        <div className="mt-10 rounded-lg border border-dashed border-line bg-card px-6 py-12">
          <h2 className="font-serif text-2xl">No dishes yet</h2>
          <p className="mt-2 text-muted">
            Upload a photo of your menu and Carte will list every dish here for you to confirm.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
          >
            Upload menu
          </Link>
        </div>
      )}

      {total > 0 && (
        <>
          <div className="sticky top-0 z-10 -mx-5 mt-8 border-b border-line bg-paper/95 px-5 py-4 backdrop-blur">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">
                {done} of {total} confirmed
              </span>
              <span className="text-muted tabular-nums">{pct}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-basil transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
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
            {shown.map((item) => (
              <article
                key={item.id}
                className={`rounded-lg border border-l-4 border-line bg-card p-5 sm:p-6 ${
                  item.confirmed ? "border-l-basil" : "border-l-saffron"
                }`}
              >
                <div className="flex items-baseline">
                  <h2 className="font-serif text-xl">{item.name}</h2>
                  <span className="leader" aria-hidden="true" />
                  <span className="tabular-nums">{item.price}</span>
                </div>
                <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
                  {item.description}
                </p>

                <fieldset className="mt-5">
                  <legend className="text-sm font-medium">Contains</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ALLERGENS.map((a) => {
                      const on = item.allergens.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggle(item, "allergens", a)}
                          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                            on
                              ? "border-ink bg-ink text-white"
                              : "border-line text-muted hover:border-muted hover:text-ink"
                          }`}
                        >
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset className="mt-4">
                  <legend className="text-sm font-medium">Suitable for</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TAGS.map((t) => {
                      const on = item.dietary_tags.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggle(item, "dietary_tags", t)}
                          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                            on
                              ? "border-basil bg-basil text-white"
                              : "border-line text-muted hover:border-muted hover:text-ink"
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <label className="mt-4 block">
                  <span className="text-sm font-medium">Kitchen notes</span>
                  <textarea
                    rows={2}
                    className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm placeholder:text-muted/70 focus:border-ink focus:outline-none"
                    placeholder="For example: fried in a shared fryer, sauce can be left off"
                    value={item.notes}
                    onChange={(e) => change({ ...item, notes: e.target.value, confirmed: false })}
                    onBlur={() => persist(item)}
                  />
                </label>

                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  {item.confirmed ? (
                    <p className="text-sm font-medium text-basil">✓ Confirmed</p>
                  ) : (
                    <button
                      onClick={() => confirmDish(item)}
                      className="rounded-md bg-basil px-4 py-2 text-sm font-medium text-white hover:bg-basil/90"
                    >
                      Confirm dish
                    </button>
                  )}
                  <button
                    onClick={() => remove(item)}
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