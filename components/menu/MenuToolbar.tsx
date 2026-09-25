"use client";
import { SearchIcon, ShieldIcon } from "@/components/icons";
import { fieldClass } from "@/components/ui/field";
import type { Allergen, DietaryTag } from "@/lib/allergens";
import { cn } from "@/lib/cn";
import type { DinerStrings } from "@/lib/i18n/diner-strings";

type MenuToolbarProps = {
  t: DinerStrings;
  query: string;
  onQuery: (query: string) => void;
  avoid: Allergen[];
  onlyTags: DietaryTag[];
  onOpenFilters: () => void;
  onRemoveAllergen: (allergen: Allergen) => void;
  onRemoveTag: (tag: DietaryTag) => void;
  onClearFilters: () => void;
  /** More active filters to show as removable pills, like "Not spicy". */
  extraPills?: { label: string; onRemove: () => void }[];
  /** Links to each menu heading, shown when the menu has sections. */
  sections?: { id: string; label: string }[];
};

const pillClass =
  "flex shrink-0 items-center gap-1.5 rounded-full py-2 ps-3.5 pe-2 text-sm font-medium whitespace-nowrap transition-colors";

/** Search and the diner's allergy and diet filters, kept in reach while scrolling the menu. */
export function MenuToolbar({
  t,
  query,
  onQuery,
  avoid,
  onlyTags,
  onOpenFilters,
  onRemoveAllergen,
  onRemoveTag,
  onClearFilters,
  extraPills = [],
  sections = [],
}: MenuToolbarProps) {
  const count = avoid.length + onlyTags.length + extraPills.length;

  return (
    <div className="sticky top-0 z-20 -mx-5 border-b border-ink/10 bg-paper/90 px-5 py-3 backdrop-blur print:hidden">
      <label className="relative block">
        <span className="sr-only">{t.searchPlaceholder}</span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 start-4 h-5 w-5 -translate-y-1/2 text-muted"
        >
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder={t.searchPlaceholder}
          maxLength={80}
          className={fieldClass("rounded-full ps-12")}
        />
      </label>

      {/* Filters scroll sideways on narrow phones instead of wrapping onto several rows. */}
      <div className="-mx-5 mt-3 flex items-center gap-2 overflow-x-auto px-5 pb-1">
        <button
          type="button"
          onClick={onOpenFilters}
          aria-haspopup="dialog"
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-[box-shadow,background-color,color] duration-200",
            count > 0
              ? "bg-ink text-white shadow-pressed-color"
              : "bg-paper text-ink shadow-raised-sm hover:text-accent",
          )}
        >
          <span aria-hidden="true" className="h-5 w-5">
            <ShieldIcon />
          </span>
          {t.filtersButton}
          {count > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-xs tabular-nums">
              {count}
            </span>
          )}
        </button>

        {avoid.map((allergen) => (
          <button
            key={allergen}
            type="button"
            onClick={() => onRemoveAllergen(allergen)}
            aria-label={t.removeFilter(t.avoidPill(t.allergens[allergen]))}
            className={cn(pillClass, "bg-saffron-soft text-saffron-ink")}
          >
            {t.avoidPill(t.allergens[allergen])}
            <span aria-hidden="true" className="px-1 text-base leading-none">
              ×
            </span>
          </button>
        ))}
        {onlyTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onRemoveTag(tag)}
            aria-label={t.removeFilter(t.tags[tag])}
            className={cn(pillClass, "bg-basil-soft text-basil")}
          >
            {t.tags[tag]}
            <span aria-hidden="true" className="px-1 text-base leading-none">
              ×
            </span>
          </button>
        ))}
        {extraPills.map((pill) => (
          <button
            key={pill.label}
            type="button"
            onClick={pill.onRemove}
            aria-label={t.removeFilter(pill.label)}
            className={cn(pillClass, "bg-ink/10 text-ink")}
          >
            {pill.label}
            <span aria-hidden="true" className="px-1 text-base leading-none">
              ×
            </span>
          </button>
        ))}
        {count > 0 && (
          <button
            type="button"
            onClick={onClearFilters}
            className="shrink-0 px-2 py-2 text-sm whitespace-nowrap text-muted underline underline-offset-4 hover:text-ink"
          >
            {t.clearFilters}
          </button>
        )}
      </div>

      {sections.length > 1 && (
        <nav
          aria-label={t.sectionsLabel}
          className="-mx-5 mt-2 flex gap-1 overflow-x-auto px-5 pb-1"
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap text-muted transition-colors hover:text-ink"
            >
              {section.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
