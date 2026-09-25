"use client";
import { Sheet } from "@/components/Sheet";
import { ToggleChip } from "@/components/ToggleChip";
import { Button } from "@/components/ui/button";
import { ALLERGENS, DIETARY_TAGS, type Allergen, type DietaryTag } from "@/lib/allergens";
import type { DinerStrings } from "@/lib/i18n/diner-strings";
import { formatWhole } from "@/lib/prices";
import { toggleValue } from "@/lib/toggle-value";

type FilterSheetProps = {
  t: DinerStrings;
  closeLabel: string;
  avoid: Allergen[];
  onlyTags: DietaryTag[];
  /** How many dishes the current filters leave, so the button can say so. */
  shownCount: number;
  /** Also hide dishes that may contain traces of an avoided allergen. */
  hideTraces: boolean;
  onHideTraces: (hideTraces: boolean) => void;
  /** The spiciest level wanted, or undefined for any. */
  maxSpice?: number;
  onMaxSpice: (maxSpice: number | undefined) => void;
  /** "Under" amounts that suit this menu's prices; empty hides the price choice. */
  priceSteps: number[];
  maxPrice: number | null;
  onMaxPrice: (maxPrice: number | null) => void;
  currency: string;
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
  hideTraces,
  onHideTraces,
  maxSpice,
  onMaxSpice,
  priceSteps,
  maxPrice,
  onMaxPrice,
  currency,
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

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-control p-4 shadow-pressed-sm">
        <input
          type="checkbox"
          checked={hideTraces}
          onChange={(event) => onHideTraces(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
        />
        <span>
          <span className="block text-sm font-medium">{t.hideTraces}</span>
          <span className="mt-0.5 block text-xs text-muted">{t.hideTracesHint}</span>
        </span>
      </label>

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

      <fieldset className="mt-7">
        <legend className="eyebrow text-muted">{t.spiceFilter}</legend>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <ToggleChip
            label={t.anySpice}
            tone="ink"
            pressed={maxSpice === undefined}
            onToggle={() => onMaxSpice(undefined)}
          />
          {t.spiceLimits.map((label, level) => (
            <ToggleChip
              key={level}
              label={label}
              tone="ink"
              pressed={maxSpice === level}
              onToggle={() => onMaxSpice(maxSpice === level ? undefined : level)}
            />
          ))}
        </div>
      </fieldset>

      {priceSteps.length > 0 && (
        <fieldset className="mt-7">
          <legend className="eyebrow text-muted">{t.priceFilter}</legend>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <ToggleChip
              label={t.anyPrice}
              tone="ink"
              pressed={maxPrice === null}
              onToggle={() => onMaxPrice(null)}
            />
            {priceSteps.map((step) => (
              <ToggleChip
                key={step}
                label={t.priceUnder(formatWhole(step, currency))}
                tone="ink"
                pressed={maxPrice === step}
                onToggle={() => onMaxPrice(maxPrice === step ? null : step)}
              />
            ))}
          </div>
        </fieldset>
      )}

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
