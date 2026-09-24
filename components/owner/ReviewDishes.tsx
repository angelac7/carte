"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
  const mutationPending = useRef(false);
  const [mutating, setMutating] = useState(false);
  const persisted = useRef(new Map<string, MenuItem>());
  const pending = useRef(new Set<string>());
  const [busy, setBusy] = useState(new Set<string>());

  function setPending(id: string, value: boolean) {
    if (value) pending.current.add(id);
    else pending.current.delete(id);
    setBusy(new Set(pending.current));
  }

  useEffect(() => {
    fetchDishes()
      .then((loaded) => {
        persisted.current = new Map(loaded.map((dish) => [dish.id, dish]));
        setDishes(loaded);
      })
      .catch(() =>
        setProblem("Your dishes couldn't be loaded. Check that Carte is running, then refresh."),
      )
      .finally(() => setLoaded(true));
  }, []);

  function showLocally(updated: MenuItem) {
    setDishes((prev) => prev.map((dish) => (dish.id === updated.id ? updated : dish)));
  }

  async function save(updated: MenuItem): Promise<MenuItem | null> {
    if (mutationPending.current || pending.current.has(updated.id)) return null;
    setPending(updated.id, true);
    try {
      const saved = await updateDish(updated);
      persisted.current.set(saved.id, saved);
      showLocally(saved);
      setProblem("");
      return saved;
    } catch (error) {
      const previous = persisted.current.get(updated.id);
      if (previous) showLocally(previous);
      setProblem(
        `Your last loaded details have been restored. ${error instanceof Error ? error.message : "Reload to review the latest details."}`,
      );
      return null;
    } finally {
      setPending(updated.id, false);
    }
  }

  // Lock the dish while saving so whole-dish writes cannot arrive out of order.
  const toggleAllergen = (dish: MenuItem, allergen: Allergen) =>
    save({ ...dish, allergens: toggleValue(dish.allergens, allergen), confirmed: false });

  const toggleTag = (dish: MenuItem, tag: DietaryTag) =>
    save({ ...dish, dietary_tags: toggleValue(dish.dietary_tags, tag), confirmed: false });

  async function confirmDish(dish: MenuItem) {
    const saved = await save({ ...dish, confirmed: true });
    if (saved?.confirmed) toast(`✓ ${saved.name} confirmed`);
  }

  async function saveDetails(dish: MenuItem, details: DishDetails) {
    if (await save({ ...dish, ...details, confirmed: false })) {
      setEditingId(null);
      toast("Details saved. Check the allergens and confirm again.");
    }
  }

  async function addDish(details: DishDetails) {
    if (mutationPending.current) return;
    mutationPending.current = true;
    setMutating(true);
    try {
      const added = await saveDishes([{ ...details, likely_allergens: [], dietary_tags: [] }]);
      for (const dish of added) persisted.current.set(dish.id, dish);
      setDishes((prev) => [...added, ...prev]);
      setAdding(false);
      setFilter("all");
      toast(`${details.name} added. Choose its allergens, then confirm it.`);
    } catch {
      setProblem("That dish wasn't added. Check that Carte is running, then try again.");
    } finally {
      mutationPending.current = false;
      setMutating(false);
    }
  }

  async function removeDish(dish: MenuItem) {
    if (mutationPending.current || pending.current.has(dish.id)) return;
    if (!window.confirm(`Delete ${dish.name} from your menu?`)) return;
    setPending(dish.id, true);
    try {
      await deleteDish(dish.id, dish.revision);
      setDishes((prev) => prev.filter((d) => d.id !== dish.id));
      persisted.current.delete(dish.id);
      toast(`${dish.name} deleted`);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "That dish could not be deleted.");
    } finally {
      setPending(dish.id, false);
    }
  }

  async function clearMenu() {
    if (mutationPending.current || pending.current.size > 0) return;
    if (
      !window.confirm(`Delete all ${dishes.length} dishes and their photos? This can’t be undone.`)
    )
      return;
    mutationPending.current = true;
    setMutating(true);
    try {
      await deleteAllDishes(dishes);
      persisted.current.clear();
      setDishes([]);
      toast("All dishes deleted");
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Your dishes could not be deleted.");
    } finally {
      mutationPending.current = false;
      setMutating(false);
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
    <main id="main" className="mx-auto max-w-3xl px-5 pb-20">
      <div className="pt-12">
        <OwnerPageHeader
          title="Review dishes"
          intro="Check each dish’s details and allergens, then confirm it. Diners only see dishes you’ve confirmed."
        >
          <Button disabled={mutating} onClick={() => setAdding(true)} shine>
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
          <Button type="button" onClick={() => window.location.reload()} className="ml-3">
            Reload latest menu
          </Button>
        </Notice>
      )}

      {loaded && total === 0 && !problem && (
        <EmptyState className="mt-10 py-14">
          <h2 className="font-serif text-3xl text-ink">No dishes yet</h2>
          <p className="mx-auto mt-2 max-w-sm">
            Upload a photo of your menu and Carte lists every dish here, or add dishes one at a
            time.
          </p>
        </EmptyState>
      )}

      {total > 0 && (
        <>
          <div className="sticky top-16 z-10 -mx-5 mt-10 border-b border-ink/10 bg-paper/95 px-5 py-5 backdrop-blur">
            <ProgressBar done={done} total={total} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex gap-1 rounded-full bg-paper p-1.5 shadow-raised-sm">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    aria-pressed={filter === f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "relative isolate rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                      filter === f.key ? "text-white" : "text-muted hover:text-ink",
                    )}
                  >
                    {filter === f.key && (
                      <motion.span
                        layoutId="review-filter"
                        className="absolute inset-0 -z-10 rounded-full bg-ink shadow-pressed-color"
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
                className={fieldClass("py-2.5 sm:ml-auto sm:w-56")}
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

          <div className="mt-8 space-y-8">
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((dish) => (
                <motion.article
                  key={dish.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="relative overflow-hidden rounded-panel bg-paper p-6 shadow-raised sm:p-8"
                >
                  <fieldset
                    disabled={mutating || busy.has(dish.id)}
                    className="min-w-0"
                    aria-busy={busy.has(dish.id)}
                  >
                    {/* Status stripe: green once confirmed, saffron while it still needs review. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-y-8 left-0 w-1.5 rounded-r-full",
                        dish.confirmed ? "bg-basil" : "bg-saffron",
                      )}
                    />
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
                          className="shrink-0 text-sm font-semibold underline underline-offset-4 hover:text-accent"
                        >
                          Edit details
                        </button>
                      </div>
                    )}

                    <DishPhotoEditor
                      dish={dish}
                      onBusy={(value) => setPending(dish.id, value)}
                      onChange={(photo_url, revision) => {
                        const updated = { ...dish, photo_url, revision, confirmed: false };
                        persisted.current.set(dish.id, updated);
                        showLocally(updated);
                      }}
                    />

                    <fieldset className="mt-5">
                      <legend className="eyebrow text-muted">Contains</legend>
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
                      <legend className="eyebrow text-muted">Suitable for</legend>
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
                        onBlur={() => {
                          if (persisted.current.get(dish.id)?.notes !== dish.notes) void save(dish);
                        }}
                      />
                    </label>

                    <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-5">
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
                  </fieldset>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

          <section className="mt-20 border-t-4 border-ink pt-6">
            <h2 className="eyebrow">Replace your menu</h2>
            <p className="mt-1 max-w-md text-sm text-muted">
              Delete every dish and its photo, for example before uploading a new menu. This can’t
              be undone.
            </p>
            <Button
              variant="secondary"
              size="sm"
              disabled={mutating || busy.size > 0}
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
          <fieldset disabled={mutating} className="mt-4">
            <DishDetailsForm
              initial={{ name: "", description: "", price: "" }}
              submitLabel="Add dish"
              onSave={addDish}
              onCancel={() => setAdding(false)}
            />
          </fieldset>
          <p className="mt-4 text-xs text-muted">
            New dishes start unconfirmed. Choose their allergens, then confirm them.
          </p>
        </Sheet>
      )}
    </main>
  );
}
