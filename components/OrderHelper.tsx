"use client";
import { useState } from "react";
import { QuantityStepper } from "@/components/QuantityStepper";
import { Sheet } from "@/components/Sheet";
import { ToggleChip } from "@/components/ToggleChip";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import type { Allergen, DietaryTag } from "@/lib/allergens";
import { askForPicks } from "@/lib/api-client";
import { HELP_STRINGS } from "@/lib/i18n/help-strings";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import type { LanguageCode } from "@/lib/languages";
import { detectCurrency } from "@/lib/prices";
import type { DishText, MenuItem } from "@/types/menu";
import type { Hunger, Recommendation } from "@/types/recommend";

type OrderHelperProps = {
  restaurantSlug: string;
  language: LanguageCode;
  dishes: MenuItem[];
  avoid: Allergen[];
  onlyTags: DietaryTag[];
  order: Record<string, number>;
  textFor: (dish: MenuItem) => DishText;
  onQuantity: (dishId: string, quantity: number) => void;
  onClose: () => void;
};

type Status = "idle" | "loading" | "done" | "failed";

function Segmented<T extends string | number>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: [T, string][];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map(([option, label]) => (
          <ToggleChip
            key={String(option)}
            label={label}
            tone="ink"
            pressed={value === option}
            onToggle={() => onChange(option)}
          />
        ))}
      </div>
    </fieldset>
  );
}

/** "What should I order?": suggestions chosen only from dishes that pass the diner's filters. */
export function OrderHelper({
  restaurantSlug,
  language,
  dishes,
  avoid,
  onlyTags,
  order,
  textFor,
  onQuantity,
  onClose,
}: OrderHelperProps) {
  const t = HELP_STRINGS[language];
  const tableText = TABLE_STRINGS[language];
  const [hunger, setHunger] = useState<Hunger>("hungry");
  const [spice, setSpice] = useState(1);
  const [people, setPeople] = useState(2);
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Recommendation | null>(null);
  const currency = detectCurrency(dishes.map((dish) => dish.price));
  const inputClass = fieldClass("mt-1");

  async function getPicks() {
    setStatus("loading");
    try {
      const budgetNumber = Number(budget);
      const recommendation = await askForPicks({
        restaurant: restaurantSlug,
        language,
        avoid,
        onlyTags,
        hunger,
        spice,
        people,
        budget: budget && budgetNumber > 0 ? budgetNumber : null,
      });
      setResult(recommendation);
      setStatus("done");
    } catch {
      setStatus("failed");
    }
  }

  const picked = (result?.picks ?? []).flatMap((pick) => {
    const dish = dishes.find((d) => d.id === pick.id);
    return dish ? [{ dish, reason: pick.reason }] : [];
  });

  return (
    <Sheet title={t.helperButton} closeLabel={tableText.close} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          getPicks();
        }}
        className="mt-4 space-y-4"
      >
        <Segmented<Hunger>
          legend={t.hunger}
          options={[
            ["light", t.hungerLight],
            ["hungry", t.hungerHungry],
            ["very", t.hungerVery],
          ]}
          value={hunger}
          onChange={setHunger}
        />
        <Segmented<number>
          legend={t.spice}
          options={t.spiceOptions.map((label, level) => [level, label] as [number, string])}
          value={spice}
          onChange={setSpice}
        />
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-medium">{t.people}</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={12}
              value={people}
              onChange={(e) => setPeople(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">
              {t.budget} ({currency})
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              placeholder={t.budgetOptional}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        {(avoid.length > 0 || onlyTags.length > 0) && (
          <p className="text-xs text-muted">{t.usesFilters}</p>
        )}
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? t.thinking : t.getPicks}
        </Button>
      </form>

      {status === "failed" && (
        <p role="alert" className="mt-4 text-sm text-tomato">
          {t.failed}
        </p>
      )}

      {status === "done" &&
        (picked.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{t.noPicks}</p>
        ) : (
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="font-serif text-xl">{t.picksTitle}</h3>
            {result?.note && <p className="mt-1 text-sm text-muted">{result.note}</p>}
            <ul className="mt-3 divide-y divide-line">
              {picked.map(({ dish, reason }) => (
                <li key={dish.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{textFor(dish).name}</p>
                    <p className="text-sm text-muted tabular-nums">{dish.price}</p>
                    <p className="mt-1 text-sm leading-relaxed">{reason}</p>
                  </div>
                  <QuantityStepper
                    quantity={order[dish.id] ?? 0}
                    onChange={(quantity) => onQuantity(dish.id, quantity)}
                    labels={tableText}
                  />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">{t.disclaimer}</p>
          </div>
        ))}
    </Sheet>
  );
}
