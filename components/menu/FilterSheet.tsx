"use client";
import { Sheet } from "@/components/Sheet";
import { ToggleChip } from "@/components/ToggleChip";
import { Button } from "@/components/ui/button";
import { ALLERGENS, DIETARY_TAGS, type Allergen, type DietaryTag } from "@/lib/allergens";
import type { DinerStrings } from "@/lib/i18n/diner-strings";
import { toggleValue } from "@/lib/toggle-value";

type FilterSheetProps = {
  t: DinerStrings;
  closeLabel: string;
  avoid: Allergen[];
  onlyTags: DietaryTag[];
  /** How many dishes the current filters leave, so the button can say so. */
  shownCount: number;
  onChange: (avoid: Allergen[], onlyTags: DietaryTag[]) => void;
  onClose: () => void;
};

/** Choose allergens to hide and diets to show. Changes apply as they're tapped. */
export function FilterSheet({
  t,
  closeLabel,
  avoid,
  onlyTags,
  shownCount,
  onChange,
  onClose,
}: FilterSheetProps) {
  return (
    <Sheet title={t.filtersButton} closeLabel={closeLabel} onClose={onClose}>
      <fieldset className="mt-6">
        <legend className="eyebrow text-muted">{t.hideContaining}</legend>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {ALLERGENS.map((allergen) => (
            <ToggleChip
              key={allergen}
              label={t.allergens[allergen]}
              tone="ink"
              pressed={avoid.includes(allergen)}
              onToggle={() => onChange(toggleValue(avoid, allergen), onlyTags)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-7">
        <legend className="eyebrow text-muted">{t.showOnly}</legend>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {DIETARY_TAGS.map((tag) => (
            <ToggleChip
              key={tag}
              label={t.tags[tag]}
              tone="basil"
              pressed={onlyTags.includes(tag)}
              onToggle={() => onChange(avoid, toggleValue(onlyTags, tag))}
            />
          ))}
        </div>
      </fieldset>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
        <Button onClick={onClose} size="lg" className="flex-1">
          {t.showDishes(shownCount)}
        </Button>
        {(avoid.length > 0 || onlyTags.length > 0) && (
          <Button onClick={() => onChange([], [])} variant="ghost">
            {t.clearFilters}
          </Button>
        )}
      </div>
    </Sheet>
  );
}
