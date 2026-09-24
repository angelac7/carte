"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DishHeader } from "@/components/DishHeader";
import { DishPhotoEditor } from "@/components/owner/DishPhotoEditor";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { Sheet } from "@/components/Sheet";
import { ToggleChip } from "@/components/ToggleChip";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldClass, labelClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { ALLERGENS, DIETARY_TAGS, type Allergen, type DietaryTag } from "@/lib/allergens";
import { deleteAllDishes, deleteDish, fetchDishes, saveDishes, updateDish } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { toggleValue } from "@/lib/toggle-value";
import type { MenuItem } from "@/types/menu";

type Filter = "all" | "review" | "confirmed";
type DishDetails = { name: string; description: string; price: string };

const inputClass = fieldClass("mt-1");

function DishDetailsForm({
  initial,
  submitLabel,
  onSave,
  onCancel,
}: {
  initial: DishDetails;
  submitLabel: string;
  onSave: (details: DishDetails) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [price, setPrice] = useState(initial.price);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ name: name.trim(), description: description.trim(), price: price.trim() });
      }}
      className="space-y-3"
    >
      <label className="block">
        <span className={labelClass}>Dish name</span>
        <input
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Description</span>
        <textarea
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Price</span>
        <input
          maxLength={20}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="$14"
          className={cn(inputClass, "max-w-40")}
        />
      </label>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm">
          {submitLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function ReviewDishes() {
  const [dishes, setDishes] = useState<MenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [problem, setProblem] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

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

  function confirmDish(dish: MenuItem) {
    save({ ...dish, confirmed: true });
    toast(`✓ ${dish.name} confirmed`);
  }

  function saveDetails(dish: MenuItem, details: DishDetails) {
    save({ ...dish, ...details, confirmed: false });
    setEditingId(null);
    toast("Details saved. Check the allergens and confirm again.");
  }

  async function addDish(details: DishDetails) {
    try {
      const added = await saveDishes([{ ...details, likely_allergens: [], dietary_tags: [] }]);
      setDishes((prev) => [...added, ...prev]);
      setAdding(false);
      setFilter("all");
      toast(`${details.name} added. Choose its allergens, then confirm it.`);
    } catch {
      setProblem("That dish wasn't added. Check that Carte is running, then try again.");
    }
  }

  function removeDish(dish: MenuItem) {
    if (!window.confirm(`Delete ${dish.name} from your menu?`)) return;
    setDishes((prev) => prev.filter((d) => d.id !== dish.id));
    deleteDish(dish.id)
      .then(() => toast(`${dish.name} deleted`))
      .catch(() =>
        setProblem("That dish wasn't deleted. Check that Carte is running, then refresh."),
      );
  }

  async function clearMenu() {
    if (
      !window.confirm(`Delete all ${dishes.length} dishes and their photos? This can’t be undone.`)
    )
      return;
    try {
      await deleteAllDishes();
      setDishes([]);
      toast("All dishes deleted");
    } catch {
      setProblem("Your dishes weren't deleted. Check that Carte is running, then try again.");
    }
  }

  const total = dishes.length;
  const done = dishes.filter((dish) => dish.confirmed).length;
  const needle = search.trim().toLowerCase();
  const shown = dishes.filter(
    (dish) =>
      (filter === "all" || (filter === "confirmed" ? dish.confirmed : !dish.confirmed)) &&
      (!needle || dish.name.toLowerCase().includes(needle)),
  );
  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: total },
    { key: "review", label: "Needs review", count: total - done },
    { key: "confirmed", label: "Confirmed", count: done },
  ];

  return (
    <main className="mx-auto max-w-3xl px-5 pb-20">
      <div className="pt-12">
        <OwnerPageHeader
          title="Review dishes"
          intro="Check each dish’s details and allergens, then confirm it. Diners only see dishes you’ve confirmed."
        >
          <Button onClick={() => setAdding(true)} shine>
            Add a dish
          </Button>
          <ButtonLink href="/dashboard/upload" variant="secondary">
            Upload a menu photo
          </ButtonLink>
        </OwnerPageHeader>
      </div>

      {problem && (
        <Notice tone="warning" role="alert" className="mt-6">
          {problem}
        </Notice>
      )}

      {loaded && total === 0 && !problem && (
        <EmptyState className="mt-10 bg-card py-12">
          <h2 className="font-serif text-3xl text-ink">No dishes yet</h2>
          <p className="mx-auto mt-2 max-w-sm">
            Upload a photo of your menu and Carte lists every dish here, or add dishes one at a
            time.
          </p>
        </EmptyState>
      )}

      {total > 0 && (
        <>
          <div className="sticky top-14 z-10 -mx-5 mt-8 border-b border-line bg-paper/95 px-5 py-4 backdrop-blur">
            <ProgressBar done={done} total={total} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex gap-1 rounded-xl border border-line bg-card p-1">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    aria-pressed={filter === f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "relative isolate rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                      filter === f.key ? "text-white" : "text-muted hover:text-ink",
                    )}
                  >
                    {filter === f.key && (
                      <motion.span
                        layoutId="review-filter"
                        className="absolute inset-0 -z-10 rounded-lg bg-ink"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    {f.label} <span className="tabular-nums opacity-70">{f.count}</span>
                  </button>
                ))}
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes"
                aria-label="Search dishes"
                className={fieldClass("py-1.5 sm:ml-auto sm:w-48")}
              />
            </div>
          </div>

          {shown.length === 0 && (
            <EmptyState className="mt-8">
              {needle
                ? "No dishes match that search."
                : filter === "review"
                  ? "Every dish is confirmed."
                  : "No dishes confirmed yet."}
            </EmptyState>
          )}

          <div className="mt-6 space-y-5">
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((dish) => (
                <motion.article
                  key={dish.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={cn(
                    "rounded-2xl border border-l-4 border-line bg-card p-5 shadow-sm sm:p-6",
                    dish.confirmed ? "border-l-basil" : "border-l-saffron",
                  )}
                >
                  {editingId === dish.id ? (
                    <DishDetailsForm
                      initial={{
                        name: dish.name,
                        description: dish.description,
                        price: dish.price,
                      }}
                      submitLabel="Save details"
                      onSave={(details) => saveDetails(dish, details)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <DishHeader name={dish.name} price={dish.price} as="h2" />
                        {dish.description && (
                          <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
                            {dish.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingId(dish.id)}
                        className="shrink-0 text-sm underline underline-offset-4 hover:text-muted"
                      >
                        Edit details
                      </button>
                    </div>
                  )}

                  <DishPhotoEditor
                    dish={dish}
                    onChange={(photo_url) => showLocally({ ...dish, photo_url })}
                  />

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
                    <span className={labelClass}>Kitchen notes</span>
                    <textarea
                      rows={2}
                      maxLength={2000}
                      className={inputClass}
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
                      <Button variant="basil" size="sm" onClick={() => confirmDish(dish)}>
                        Confirm dish
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => removeDish(dish)}>
                      Delete
                    </Button>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

          <section className="mt-16 border-t border-line pt-6">
            <h2 className="text-sm font-medium">Replace your menu</h2>
            <p className="mt-1 max-w-md text-sm text-muted">
              Delete every dish and its photo, for example before uploading a new menu. This can’t
              be undone.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={clearMenu}
              className="mt-3 text-tomato hover:border-tomato"
            >
              Delete all dishes
            </Button>
          </section>
        </>
      )}

      {adding && (
        <Sheet title="Add a dish" closeLabel="Close" onClose={() => setAdding(false)}>
          <div className="mt-4">
            <DishDetailsForm
              initial={{ name: "", description: "", price: "" }}
              submitLabel="Add dish"
              onSave={addDish}
              onCancel={() => setAdding(false)}
            />
          </div>
          <p className="mt-4 text-xs text-muted">
            New dishes start unconfirmed. Choose their allergens, then confirm them.
          </p>
        </Sheet>
      )}
    </main>
  );
}
