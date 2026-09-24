"use client";
import { useState } from "react";
import { Chip } from "@/components/Chip";
import { DishHeader } from "@/components/DishHeader";
import { ToggleChip } from "@/components/ToggleChip";
import { ALLERGENS, DIETARY_TAGS, type Allergen, type DietaryTag } from "@/lib/allergens";
import { filterDishes } from "@/lib/menu-filters";
import { toggleValue } from "@/lib/toggle-value";
import type { MenuItem } from "@/types/menu";

const SAFETY_NOTICE =
  "Allergen information comes from the restaurant. Kitchens share equipment and recipes change, so always tell your server about allergies before ordering.";

/** The public menu diners see. Receives confirmed dishes only. */
export function DinerMenu({ dishes }: { dishes: MenuItem[] }) {
  const [avoid, setAvoid] = useState<Allergen[]>([]);
  const [onlyTags, setOnlyTags] = useState<DietaryTag[]>([]);

  const shown = filterDishes(dishes, { avoid, onlyTags });
  const hiddenCount = dishes.length - shown.length;
  const filtering = avoid.length > 0 || onlyTags.length > 0;

  function clearFilters() {
    setAvoid([]);
    setOnlyTags([]);
  }

  if (dishes.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-serif text-4xl leading-tight">Menu</h1>
        <p className="mt-4 text-muted">
          This menu isn’t ready yet. Ask your server for today’s menu and allergen information.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pb-16">
      <div className="pt-12">
        <h1 className="font-serif text-4xl leading-tight">Menu</h1>
        <p
          role="note"
          className="mt-4 rounded-md border border-saffron/40 bg-saffron-soft px-4 py-3 text-sm leading-relaxed text-saffron-ink"
        >
          {SAFETY_NOTICE}
        </p>
      </div>

      <section
        aria-label="Filters"
        className="mt-8 rounded-lg border border-line bg-card p-5 sm:p-6"
      >
        <fieldset>
          <legend className="text-sm font-medium">Hide dishes that contain</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALLERGENS.map((allergen) => (
              <ToggleChip
                key={allergen}
                label={allergen}
                tone="ink"
                pressed={avoid.includes(allergen)}
                onToggle={() => setAvoid((prev) => toggleValue(prev, allergen))}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Show only dishes marked</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIETARY_TAGS.map((tag) => (
              <ToggleChip
                key={tag}
                label={tag}
                tone="basil"
                pressed={onlyTags.includes(tag)}
                onToggle={() => setOnlyTags((prev) => toggleValue(prev, tag))}
              />
            ))}
          </div>
        </fieldset>

        {filtering && (
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4 text-sm">
            <p aria-live="polite" className="text-muted">
              Showing {shown.length} of {dishes.length} dishes.
              {hiddenCount > 0 && ` ${hiddenCount} hidden by your filters.`}
            </p>
            <button onClick={clearFilters} className="shrink-0 text-muted underline hover:text-ink">
              Clear filters
            </button>
          </div>
        )}
      </section>

      {shown.length === 0 ? (
        <p className="mt-10 text-muted">
          No dishes match your filters. Try removing one, or ask your server what the kitchen can
          adjust.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-card px-5 sm:px-6">
          {shown.map((dish) => (
            <li key={dish.id} className="py-5">
              <DishHeader name={dish.name} price={dish.price} as="h2" />
              <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
                {dish.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {dish.allergens.length > 0 ? (
                  <>
                    <span className="text-muted">Contains</span>
                    {dish.allergens.map((allergen) => (
                      <Chip key={allergen} label={allergen} tone="allergen" />
                    ))}
                  </>
                ) : (
                  <span className="text-muted">None of the 9 major allergens listed</span>
                )}
                {dish.dietary_tags.map((tag) => (
                  <Chip key={tag} label={tag} tone="tag" />
                ))}
              </div>
              {dish.notes && (
                <p className="mt-2 text-sm leading-relaxed">
                  <span className="font-medium">Kitchen note:</span> {dish.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
