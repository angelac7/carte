"use client";
import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { ToggleChip } from "@/components/ToggleChip";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/components/ui/field";
import { ALLERGENS } from "@/lib/allergens";
import { toggleValue } from "@/lib/toggle-value";
import type { DishAddon, DishSize, MenuItem } from "@/types/menu";

const MAX_SIZES = 8;
const MAX_ADDONS = 12;
const inputClass = fieldClass("mt-1");

/** Sizes and add-ons for one dish. Rows left without a name are dropped when saving. */
export function DishOptionsEditor({
  dish,
  onSave,
  onClose,
}: {
  dish: MenuItem;
  onSave: (sizes: DishSize[], addons: DishAddon[]) => void;
  onClose: () => void;
}) {
  const [sizes, setSizes] = useState<DishSize[]>(dish.sizes ?? []);
  const [addons, setAddons] = useState<DishAddon[]>(dish.addons ?? []);
  const updateSize = (index: number, change: Partial<DishSize>) =>
    setSizes((rows) => rows.map((row, i) => (i === index ? { ...row, ...change } : row)));
  const updateAddon = (index: number, change: Partial<DishAddon>) =>
    setAddons((rows) => rows.map((row, i) => (i === index ? { ...row, ...change } : row)));

  function save() {
    const named = <T extends { label: string; price: string }>(rows: T[]) =>
      rows
        .map((row) => ({ ...row, label: row.label.trim(), price: row.price.trim() }))
        .filter((row) => row.label);
    onSave(named(sizes), named(addons));
  }

  return (
    <Sheet title={`Sizes and add-ons: ${dish.name}`} closeLabel="Close" onClose={onClose}>
      <p className="mt-2 text-sm text-muted">
        Add-ons can bring their own allergens, so saving asks you to confirm the dish again.
      </p>

      <fieldset className="mt-6">
        <legend className="eyebrow text-muted">Sizes</legend>
        <p className="mt-1 text-xs text-muted">
          Each size has its own price, like Regular $14 and Large $17.
        </p>
        <div className="mt-3 space-y-3">
          {sizes.map((size, index) => (
            <div key={index} className="flex items-end gap-2">
              <label className="block flex-1">
                <span className={labelClass}>Size</span>
                <input
                  value={size.label}
                  maxLength={60}
                  placeholder="Large"
                  onChange={(e) => updateSize(index, { label: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block w-28">
                <span className={labelClass}>Price</span>
                <input
                  value={size.price}
                  maxLength={20}
                  placeholder="$17"
                  onChange={(e) => updateSize(index, { price: e.target.value })}
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                aria-label={`Remove size ${size.label || index + 1}`}
                onClick={() => setSizes((rows) => rows.filter((_, i) => i !== index))}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-muted hover:text-tomato"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {sizes.length < MAX_SIZES && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => setSizes((rows) => [...rows, { label: "", price: "" }])}
          >
            Add a size
          </Button>
        )}
      </fieldset>

      <fieldset className="mt-8">
        <legend className="eyebrow text-muted">Add-ons</legend>
        <p className="mt-1 text-xs text-muted">
          Extras diners can add, like an egg or extra noodles. Leave the price empty if it&apos;s
          free.
        </p>
        <div className="mt-3 space-y-5">
          {addons.map((addon, index) => (
            <div key={index} className="rounded-control p-4 shadow-pressed-sm">
              <div className="flex items-end gap-2">
                <label className="block flex-1">
                  <span className={labelClass}>Add-on</span>
                  <input
                    value={addon.label}
                    maxLength={60}
                    placeholder="Add egg"
                    onChange={(e) => updateAddon(index, { label: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="block w-28">
                  <span className={labelClass}>Price</span>
                  <input
                    value={addon.price}
                    maxLength={20}
                    placeholder="$2"
                    onChange={(e) => updateAddon(index, { price: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <button
                  type="button"
                  aria-label={`Remove add-on ${addon.label || index + 1}`}
                  onClick={() => setAddons((rows) => rows.filter((_, i) => i !== index))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-muted hover:text-tomato"
                >
                  ×
                </button>
              </div>
              <p className="mt-3 text-xs font-medium text-muted">This add-on contains</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALLERGENS.map((allergen) => (
                  <ToggleChip
                    key={allergen}
                    label={allergen}
                    ariaLabel={`${addon.label || "Add-on"} contains ${allergen}`}
                    tone="ink"
                    pressed={addon.allergens.includes(allergen)}
                    onToggle={() =>
                      updateAddon(index, { allergens: toggleValue(addon.allergens, allergen) })
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        {addons.length < MAX_ADDONS && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => setAddons((rows) => [...rows, { label: "", price: "", allergens: [] }])}
          >
            Add an add-on
          </Button>
        )}
      </fieldset>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-ink/10 pt-6">
        <Button onClick={save}>Save sizes and add-ons</Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Sheet>
  );
}
