"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DishHeader } from "@/components/DishHeader";
import { DishOptionsEditor } from "@/components/owner/DishOptionsEditor";
import { DishPhotoEditor } from "@/components/owner/DishPhotoEditor";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { Sheet } from "@/components/Sheet";
import { ToggleChip } from "@/components/ToggleChip";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldClass, labelClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import {
  ALLERGEN_LIST_VERSION,
  ALLERGENS,
  DIETARY_TAGS,
  NEWER_ALLERGENS,
  US_ALLERGENS,
  type Allergen,
  type DietaryTag,
} from "@/lib/allergens";
import {
  deleteAllDishes,
  deleteDish,
  fetchDishes,
  reorderDishes,
  saveDishes,
  setDishSoldOut,
  updateDish,
} from "@/lib/api-client";
import { restaurantClock, shortTime } from "@/lib/availability";
import { cn } from "@/lib/cn";
import { groupBySection, hasSections, moveDish, moveSection } from "@/lib/menu-sections";
import { tagConflictMessages } from "@/lib/tag-conflicts";
import { toggleValue } from "@/lib/toggle-value";
import type { MenuItem } from "@/types/menu";

type Filter = "all" | "review" | "confirmed";
type DishDetails = { name: string; description: string; price: string; source_language?: string };

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
  const [sourceLanguage, setSourceLanguage] = useState(initial.source_language ?? "und");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({
          name: name.trim(),
          description: description.trim(),
          price: price.trim(),
          source_language: sourceLanguage,
        });
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
      <label className="block">
        <span className={labelClass}>Language of the dish text</span>
        <input
          required
          maxLength={35}
          pattern="[a-z]{2,3}(-[A-Za-z0-9]{2,8})*"
          value={sourceLanguage}
          onChange={(event) => setSourceLanguage(event.target.value)}
          className={inputClass}
        />
        <span className="text-xs text-muted">
          Use a language code such as en, es, ja, ar, or th. Use und for automatic detection or
          mixed languages. Include kitchen notes in this language.
        </span>
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

/** Up and down arrows for reordering, labeled so screen readers say what moves. */
function MoveButtons({
  label,
  canUp,
  canDown,
  disabled,
  onMove,
}: {
  label: string;
  canUp: boolean;
  canDown: boolean;
  disabled: boolean;
  onMove: (direction: -1 | 1) => void;
}) {
  const arrowClass =
    "flex h-11 w-11 items-center justify-center rounded-full bg-paper text-lg shadow-raised-sm transition-[box-shadow,color] hover:text-accent active:shadow-pressed-sm disabled:opacity-40 disabled:shadow-none";
  return (
    <div className="flex shrink-0 gap-1.5">
      <button
        type="button"
        aria-label={`Move ${label} up`}
        disabled={disabled || !canUp}
        onClick={() => onMove(-1)}
        className={arrowClass}
      >
        ↑
      </button>
      <button
        type="button"
        aria-label={`Move ${label} down`}
        disabled={disabled || !canDown}
        onClick={() => onMove(1)}
        className={arrowClass}
      >
        ↓
      </button>
    </div>
  );
}

/** Today's service, specials, and serving times. None of these need the dish confirmed again. */
function AvailabilityControls({
  dish,
  soldOut,
  onSoldOut,
  onSpecial,
  onServingTimes,
}: {
  dish: MenuItem;
  soldOut: boolean;
  onSoldOut: (soldOut: boolean) => void;
  onSpecial: (special: boolean) => void;
  onServingTimes: (from: string | null, until: string | null) => void;
}) {
  const [from, setFrom] = useState(shortTime(dish.available_from));
  const [until, setUntil] = useState(shortTime(dish.available_until));
  const saved = [shortTime(dish.available_from), shortTime(dish.available_until)];
  const changed = from !== saved[0] || until !== saved[1];
  const complete = Boolean(from) === Boolean(until);
  const pillClass = (on: boolean) =>
    cn(
      "rounded-full px-4 py-2.5 text-sm font-medium transition-[box-shadow,background-color,color] duration-200",
      on
        ? "bg-ink text-white shadow-pressed-color"
        : "bg-paper text-muted shadow-raised-sm hover:text-ink",
    );

  return (
    <fieldset className="mt-5">
      <legend className="eyebrow text-muted">Availability</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={soldOut}
          onClick={() => onSoldOut(!soldOut)}
          className={cn(pillClass(soldOut), soldOut && "bg-tomato")}
        >
          Sold out today
        </button>
        <button
          type="button"
          aria-pressed={Boolean(dish.special)}
          onClick={() => onSpecial(!dish.special)}
          className={pillClass(Boolean(dish.special))}
        >
          Special
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className={labelClass}>Served from</span>
          <input
            type="time"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={cn(inputClass, "w-36")}
          />
        </label>
        <label className="block">
          <span className={labelClass}>until</span>
          <input
            type="time"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className={cn(inputClass, "w-36")}
          />
        </label>
        {changed && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!complete}
            onClick={() => onServingTimes(from || null, until || null)}
          >
            Save times
          </Button>
        )}
        {(saved[0] || from) && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setFrom("");
              setUntil("");
              onServingTimes(null, null);
            }}
          >
            Served all day
          </Button>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">
        Leave both empty if it&apos;s served whenever you&apos;re open. Sold out resets on its own
        tomorrow.
      </p>
    </fieldset>
  );
}

/** Confirmed against today's full allergen list, not just the original 9. */
const checkedForAll = (dish: MenuItem) => (dish.allergen_list ?? 1) >= ALLERGEN_LIST_VERSION;

export default function ReviewDishes({ timezone }: { timezone: string }) {
  const [dishes, setDishes] = useState<MenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [problem, setProblem] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // The dish whose sizes and add-ons are open in the editor.
  const [optionsId, setOptionsId] = useState<string | null>(null);
  const mutationPending = useRef(false);
  const [mutating, setMutating] = useState(false);
  const persisted = useRef(new Map<string, MenuItem>());
  const pending = useRef(new Set<string>());
  const [busy, setBusy] = useState(new Set<string>());
  // Section names being typed, saved when the field loses focus, so cards don't jump while typing.
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, string>>({});

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

  async function save(
    updated: MenuItem,
    options: { confirm?: boolean } = {},
  ): Promise<MenuItem | null> {
    if (mutationPending.current || pending.current.has(updated.id)) return null;
    setPending(updated.id, true);
    try {
      const saved = await updateDish(updated, options);
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
  // A dish's own allergens, what can be left out, and what may get in stay consistent.
  const toggleAllergen = (dish: MenuItem, allergen: Allergen) => {
    const allergens = toggleValue(dish.allergens, allergen);
    return save({
      ...dish,
      allergens,
      removable: (dish.removable ?? []).filter((a) => allergens.includes(a)),
      may_contain: (dish.may_contain ?? []).filter((a) => !allergens.includes(a)),
      confirmed: false,
    });
  };

  const toggleRemovable = (dish: MenuItem, allergen: Allergen) =>
    save({ ...dish, removable: toggleValue(dish.removable ?? [], allergen), confirmed: false });

  const toggleMayContain = (dish: MenuItem, allergen: Allergen) =>
    save({ ...dish, may_contain: toggleValue(dish.may_contain ?? [], allergen), confirmed: false });

  const toggleTag = (dish: MenuItem, tag: DietaryTag) =>
    save({ ...dish, dietary_tags: toggleValue(dish.dietary_tags, tag), confirmed: false });

  async function confirmDish(dish: MenuItem) {
    const saved = await save({ ...dish, confirmed: true }, { confirm: true });
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
      setDishes((prev) => [...prev, ...added]);
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

  // Moving dishes is layout only: it never changes whether a dish is confirmed.
  async function applyOrder(next: MenuItem[]) {
    if (mutationPending.current || pending.current.size > 0) return;
    const previous = dishes;
    mutationPending.current = true;
    setMutating(true);
    setDishes(next);
    try {
      const moved = new Map(
        (await reorderDishes(next.map((dish) => dish.id))).map((m) => [m.id, m]),
      );
      const withVersions = (dish: MenuItem) => {
        const change = moved.get(dish.id);
        return change
          ? { ...dish, revision: change.revision, sort_order: change.sort_order }
          : dish;
      };
      for (const [id, saved] of persisted.current) persisted.current.set(id, withVersions(saved));
      setDishes(next.map(withVersions));
    } catch (error) {
      setDishes(previous);
      setProblem(error instanceof Error ? error.message : "The new order couldn't be saved.");
    } finally {
      mutationPending.current = false;
      setMutating(false);
    }
  }

  // Today's service day in the restaurant's time zone, for the sold-out switch.
  const serviceDay = restaurantClock(timezone)?.date;

  async function toggleSoldOut(dish: MenuItem, soldOut: boolean) {
    if (mutationPending.current || pending.current.has(dish.id)) return;
    setPending(dish.id, true);
    try {
      const saved = await setDishSoldOut(dish.id, soldOut);
      persisted.current.set(saved.id, saved);
      showLocally(saved);
      toast(soldOut ? `${dish.name} is sold out for today` : `${dish.name} is available again`);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "That dish couldn't be updated.");
    } finally {
      setPending(dish.id, false);
    }
  }

  // Reads the field itself, so a quick tab away right after typing still saves.
  async function saveSection(dish: MenuItem, typed: string) {
    const section = typed.trim();
    if (section !== (dish.section ?? "") && (await save({ ...dish, section }))) {
      toast(section ? `${dish.name} moved to ${section}` : `${dish.name} has no section now`);
    }
    setSectionDrafts((prev) => {
      const next = { ...prev };
      delete next[dish.id];
      return next;
    });
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
      !window.confirm(
        dishes.length === 1
          ? "Delete the 1 dish and its photo? This can’t be undone."
          : `Delete all ${dishes.length} dishes and their photos? This can’t be undone.`,
      )
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
  const done = dishes.filter((dish) => dish.confirmed && checkedForAll(dish)).length;
  const olderList = dishes.filter((dish) => dish.confirmed && !checkedForAll(dish)).length;
  const needle = search.trim().toLowerCase();
  const shown = dishes.filter(
    (dish) =>
      (filter === "all" ||
        (filter === "confirmed"
          ? dish.confirmed && checkedForAll(dish)
          : !(dish.confirmed && checkedForAll(dish)))) &&
      (!needle || dish.name.toLowerCase().includes(needle)),
  );
  // Reordering only makes sense with the whole menu in view.
  const ordering = filter === "all" && !needle;
  const groups = groupBySection(shown);
  const sectioned = hasSections(groups);
  const sectionNames = [...new Set(dishes.map((dish) => dish.section ?? "").filter(Boolean))];
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

      {olderList > 0 && (
        <Notice className="mt-6">
          Carte now covers {ALLERGENS.length} allergens.{" "}
          {olderList === 1 ? "1 dish was" : `${olderList} dishes were`} confirmed before{" "}
          {NEWER_ALLERGENS.join(", ")} were added. Check those and press &ldquo;Confirm all{" "}
          {ALLERGENS.length} allergens&rdquo; so diners who avoid them can see{" "}
          {olderList === 1 ? "it" : "them"}.
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

          <datalist id="menu-section-names">
            {sectionNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <div className="mt-8 space-y-12">
            {groups.map((group, groupIndex) => (
              <section
                key={group.section || "none"}
                aria-label={sectioned ? group.section || "No section" : undefined}
              >
                {sectioned && (
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h2 className="font-serif text-3xl tracking-tight">
                      {group.section || "No section"}{" "}
                      <span className="text-base text-muted tabular-nums">
                        {group.dishes.length}
                      </span>
                    </h2>
                    {ordering && (
                      <MoveButtons
                        label={`the ${group.section || "No section"} section`}
                        canUp={groupIndex > 0}
                        canDown={groupIndex < groups.length - 1}
                        disabled={mutating || busy.size > 0}
                        onMove={(direction) =>
                          applyOrder(moveSection(dishes, groupIndex, direction))
                        }
                      />
                    )}
                  </div>
                )}
                <div className="space-y-8">
                  <AnimatePresence initial={false} mode="popLayout">
                    {group.dishes.map((dish, dishIndex) => {
                      const conflicts = tagConflictMessages(dish.allergens, dish.dietary_tags);
                      return (
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
                                <div className="flex shrink-0 flex-col items-end gap-3">
                                  <button
                                    onClick={() => setEditingId(dish.id)}
                                    className="text-sm font-semibold underline underline-offset-4 hover:text-accent"
                                  >
                                    Edit details
                                  </button>
                                  {ordering && group.dishes.length > 1 && (
                                    <MoveButtons
                                      label={dish.name}
                                      canUp={dishIndex > 0}
                                      canDown={dishIndex < group.dishes.length - 1}
                                      disabled={mutating || busy.size > 0}
                                      onMove={(direction) =>
                                        applyOrder(moveDish(dishes, dish.id, direction))
                                      }
                                    />
                                  )}
                                </div>
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

                            <div className="mt-5 flex flex-wrap gap-4">
                              <label className="block w-full max-w-xs">
                                <span className={labelClass}>Menu section</span>
                                <input
                                  list="menu-section-names"
                                  maxLength={80}
                                  placeholder="For example: Starters"
                                  value={sectionDrafts[dish.id] ?? dish.section ?? ""}
                                  onChange={(e) =>
                                    setSectionDrafts((prev) => ({
                                      ...prev,
                                      [dish.id]: e.target.value,
                                    }))
                                  }
                                  onBlur={(event) =>
                                    void saveSection(dish, event.currentTarget.value)
                                  }
                                  className={inputClass}
                                />
                              </label>

                              <label className="block">
                                <span className={labelClass}>Spice level</span>

                                <select
                                  value={dish.spice ?? ""}

                                  onChange={(e) =>
                                    void save({
                                      ...dish,
                                      spice: e.target.value === "" ? null : Number(e.target.value),
                                    })
                                  }

                                  className={inputClass}
                                >
                                  <option value="">Not set</option>

                                  <option value="0">Not spicy</option>

                                  <option value="1">Mild</option>

                                  <option value="2">Medium</option>

                                  <option value="3">Hot</option>
                                </select>
                              </label>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                              <span className="text-muted">
                                {dish.sizes?.length || dish.addons?.length
                                  ? [
                                      dish.sizes?.length
                                        ? `${dish.sizes.length} ${dish.sizes.length === 1 ? "size" : "sizes"}`
                                        : "",
                                      dish.addons?.length
                                        ? `${dish.addons.length} ${dish.addons.length === 1 ? "add-on" : "add-ons"}`
                                        : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")
                                  : "No sizes or add-ons"}
                              </span>
                              <button
                                type="button"
                                onClick={() => setOptionsId(dish.id)}
                                className="font-semibold underline underline-offset-4 hover:text-accent"
                              >
                                Edit sizes and add-ons
                              </button>
                            </div>

                            <AvailabilityControls
                              dish={dish}
                              soldOut={Boolean(serviceDay && dish.sold_out_on === serviceDay)}
                              onSoldOut={(soldOut) => toggleSoldOut(dish, soldOut)}
                              onSpecial={(special) => void save({ ...dish, special })}
                              onServingTimes={(from, until) =>
                                void save({ ...dish, available_from: from, available_until: until })
                              }
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

                            {dish.allergens.length > 0 && (
                              <fieldset className="mt-4">
                                <legend className="eyebrow text-muted">Can be made without</legend>

                                <p className="mt-1 text-xs text-muted">
                                  Allergens the kitchen can leave out on request. Diners avoiding
                                  only these still see the dish, with &ldquo;Ask for it
                                  without…&rdquo;.
                                </p>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  {dish.allergens.map((allergen) => (
                                    <ToggleChip
                                      key={allergen}

                                      label={allergen}

                                      tone="ink"

                                      ariaLabel={`Can leave out ${allergen}`}

                                      pressed={(dish.removable ?? []).includes(allergen)}

                                      onToggle={() => toggleRemovable(dish, allergen)}
                                    />
                                  ))}
                                </div>
                              </fieldset>
                            )}

                            <fieldset className="mt-4">
                              <legend className="eyebrow text-muted">May contain</legend>

                              <p className="mt-1 text-xs text-muted">
                                Not in the recipe, but could get in, like through a shared fryer.
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                {ALLERGENS.filter(
                                  (allergen) => !dish.allergens.includes(allergen),
                                ).map((allergen) => (
                                  <ToggleChip
                                    key={allergen}

                                    label={allergen}

                                    tone="ink"

                                    ariaLabel={`May contain ${allergen}`}

                                    pressed={(dish.may_contain ?? []).includes(allergen)}

                                    onToggle={() => toggleMayContain(dish, allergen)}
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

                            {conflicts.length > 0 && (
                              <Notice tone="warning" role="alert" className="mt-4">
                                <span id={`conflict-${dish.id}`}>{conflicts.join(" ")}</span>
                              </Notice>
                            )}

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
                                  if (persisted.current.get(dish.id)?.notes !== dish.notes)
                                    void save(dish);
                                }}
                              />
                            </label>

                            <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-5">
                              {dish.confirmed && checkedForAll(dish) ? (
                                <p className="text-sm font-medium text-basil">✓ Confirmed</p>
                              ) : dish.confirmed ? (
                                <div className="flex flex-wrap items-center gap-3">
                                  <Button
                                    variant="basil"
                                    size="sm"
                                    onClick={() => confirmDish(dish)}
                                    disabled={conflicts.length > 0}
                                  >
                                    Confirm all {ALLERGENS.length} allergens
                                  </Button>
                                  <span className="text-xs text-muted">
                                    Confirmed for the original {US_ALLERGENS.length}
                                  </span>
                                </div>
                              ) : (
                                <Button
                                  variant="basil"
                                  size="sm"
                                  onClick={() => confirmDish(dish)}
                                  // A contradicted diet tag must be fixed before diners can see the dish.
                                  disabled={conflicts.length > 0}
                                  aria-describedby={
                                    conflicts.length > 0 ? `conflict-${dish.id}` : undefined
                                  }
                                >
                                  Confirm dish
                                </Button>
                              )}
                              <Button variant="danger" size="sm" onClick={() => removeDish(dish)}>
                                Delete
                              </Button>
                            </div>
                          </fieldset>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </section>
            ))}
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

      {optionsId &&
        (() => {
          const dish = dishes.find((d) => d.id === optionsId);
          return dish ? (
            <DishOptionsEditor
              dish={dish}
              onClose={() => setOptionsId(null)}
              onSave={async (sizes, addons) => {
                if (await save({ ...dish, sizes, addons, confirmed: false })) {
                  setOptionsId(null);
                  toast("Sizes and add-ons saved. Check the allergens and confirm again.");
                }
              }}
            />
          ) : null;
        })()}
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
