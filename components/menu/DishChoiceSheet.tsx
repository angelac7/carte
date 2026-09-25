"use client";
import { useState } from "react";
import { Chip } from "@/components/Chip";
import { Sheet } from "@/components/Sheet";
import { Button } from "@/components/ui/button";
import type { Allergen } from "@/lib/allergens";
import { cn } from "@/lib/cn";
import type { DinerStrings } from "@/lib/i18n/diner-strings";
import { blockedAddons, linePrice, type LineChoice } from "@/lib/order-lines";
import { formatMoney } from "@/lib/prices";
import { toggleValue } from "@/lib/toggle-value";
import type { DishText, MenuItem } from "@/types/menu";

type DishChoiceSheetProps = {
  dish: MenuItem;
  text: DishText;
  t: DinerStrings;
  closeLabel: string;
  avoid: Allergen[];
  currency: string;
  onAdd: (choice: LineChoice) => void;
  onClose: () => void;
};

const optionClass =
  "flex cursor-pointer items-start justify-between gap-4 rounded-control px-4 py-3 transition-[box-shadow] has-checked:shadow-pressed-sm has-disabled:cursor-not-allowed has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent";

/** Pick a size and add-ons before adding a dish to the order. Add-on allergens always show. */
export function DishChoiceSheet({
  dish,
  text,
  t,
  closeLabel,
  avoid,
  currency,
  onAdd,
  onClose,
}: DishChoiceSheetProps) {
  const sizes = dish.sizes ?? [];
  const addons = dish.addons ?? [];
  const blocked = blockedAddons(dish, avoid);
  const [size, setSize] = useState<number | null>(sizes.length > 0 ? 0 : null);
  const [picked, setPicked] = useState<number[]>([]);
  const optionName = (index: number, original: string) => text.options?.[index] || original;
  const price = linePrice(dish, { size, addons: picked });

  return (
    <Sheet title={text.name} closeLabel={closeLabel} onClose={onClose}>
      {sizes.length > 0 && (
        <fieldset className="mt-5">
          <legend className="eyebrow text-muted">{t.sizes}</legend>
          <div className="mt-2 space-y-1">
            {sizes.map((option, index) => (
              <label key={index} className={optionClass}>
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="size"
                    checked={size === index}
                    onChange={() => setSize(index)}
                    className="h-5 w-5 accent-accent"
                  />
                  {optionName(index, option.label)}
                </span>
                <span className="font-mono text-sm tabular-nums">{option.price}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {addons.length > 0 && (
        <fieldset className="mt-5">
          <legend className="eyebrow text-muted">{t.addons}</legend>
          <div className="mt-2 space-y-1">
            {addons.map((addon, index) => {
              const isBlocked = blocked.includes(index);
              return (
                <label key={index} className={optionClass}>
                  <span className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={picked.includes(index)}
                      disabled={isBlocked}
                      onChange={() => setPicked((current) => toggleValue(current, index))}
                      className="mt-0.5 h-5 w-5 accent-accent"
                    />
                    <span>
                      <span className={cn(isBlocked && "text-muted line-through")}>
                        {optionName(sizes.length + index, addon.label)}
                      </span>
                      {addon.allergens.length > 0 && (
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="eyebrow text-muted">{t.contains}</span>
                          {addon.allergens.map((allergen) => (
                            <Chip key={allergen} label={t.allergens[allergen]} tone="allergen" />
                          ))}
                        </span>
                      )}
                      {isBlocked && (
                        <span className="mt-1 block text-xs font-medium text-tomato">
                          {t.addonBlocked}
                        </span>
                      )}
                    </span>
                  </span>
                  {addon.price && (
                    <span className="font-mono text-sm tabular-nums">+{addon.price}</span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-8 border-t border-ink/10 pt-6">
        <Button onClick={() => onAdd({ size, addons: picked })} size="lg" className="w-full">
          {t.addToOrder}
          {price !== null && ` · ${formatMoney(price, currency)}`}
        </Button>
      </div>
    </Sheet>
  );
}
