"use client";
import { useState } from "react";
import { AllergyStatement } from "@/components/AllergyCard";
import { OrderTogether } from "@/components/OrderTogether";
import { TableAllergies } from "@/components/TableAllergies";
import { QuantityStepper } from "@/components/QuantityStepper";
import { Sheet } from "@/components/Sheet";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import type { Allergen, OtherAvoid } from "@/lib/allergens";
import type { TableAllergyEntry } from "@/lib/table-allergies";
import type { Severity } from "@/lib/diner-prefs";
import { splitBill, type BillLine } from "@/lib/bill";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import type { LanguageCode } from "@/lib/languages";
import { choiceLabels, linePrice, orderLines } from "@/lib/order-lines";
import { detectCurrency, formatMoney } from "@/lib/prices";
import type { DishText, MenuItem } from "@/types/menu";

type OrderSheetProps = {
  dishes: MenuItem[];
  /** Quantities by order line: a dish's id, or the dish with its size and add-ons. */
  order: Record<string, number>;
  textFor: (dish: MenuItem) => DishText;
  language: LanguageCode;
  staffLanguage?: LanguageCode;
  avoid: Allergen[];
  /** Other things the diner doesn't eat, told to staff with the allergies. */
  alsoAvoid?: OtherAvoid[];
  severity?: Severity;
  onQuantity: (lineKey: string, quantity: number) => void;
  onClear: () => void;
  onClose: () => void;
  /** The table's shared order, when there is one. */
  tableCode?: string | null;
  tableEnded?: boolean;
  onStartTogether?: () => Promise<string>;
  onLeaveTogether?: () => void;
  /** Allergies people at the shared table chose to share, and this phone's id there. */
  tableAllergies?: Record<string, TableAllergyEntry>;
  myTableId?: string | null;
  onShareAllergies?: (entry: TableAllergyEntry | null) => Promise<void>;
};

type Mode = "list" | "split" | "server";

const TIP_OPTIONS = [0, 15, 18, 20];
const MAX_PEOPLE = 12;

function clampPercent(value: string): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(30, number)) : 0;
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={strong ? "font-medium" : ""}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-medium" : ""}`}>{value}</dd>
    </div>
  );
}

/** The diner's order: adjust quantities, show it to staff, or split the bill. */
export function OrderSheet({
  dishes,
  order,
  textFor,
  language,
  staffLanguage = "en",
  avoid,
  alsoAvoid = [],
  severity = "allergy",
  onQuantity,
  onClear,
  onClose,
  tableCode = null,
  tableEnded = false,
  onStartTogether,
  onLeaveTogether,
  tableAllergies = {},
  myTableId = null,
  onShareAllergies,
}: OrderSheetProps) {
  const t = TABLE_STRINGS[language];
  const [mode, setMode] = useState<Mode>("list");
  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState("");
  const [assignees, setAssignees] = useState<Record<string, string>>({});
  const [taxPercent, setTaxPercent] = useState(8);
  const [tipPercent, setTipPercent] = useState(18);

  const lines = orderLines(dishes, order);
  const currency = detectCurrency(lines.map(({ dish }) => dish.price));
  const money = (amount: number) => formatMoney(amount, currency);

  function addPerson() {
    const name = newPerson.trim();
    if (!name || people.includes(name) || people.length >= MAX_PEOPLE) return;
    setPeople([...people, name]);
    setNewPerson("");
  }

  function removePerson(name: string) {
    setPeople(people.filter((person) => person !== name));
    setAssignees((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([, person]) => person !== name)),
    );
  }

  if (mode === "server") {
    return (
      <Sheet
        title={TABLE_STRINGS[staffLanguage].yourOrder}
        closeLabel={t.back}
        onClose={() => setMode("list")}
      >
        <ul className="mt-4 space-y-3">
          {lines.map(({ key, dish, choice, quantity }) => (
            <li lang={dish.source_language ?? "und"} key={key} className="flex gap-3 text-xl">
              <span className="font-medium tabular-nums">{quantity} ×</span>
              <span>
                {dish.name}
                {choice.size !== null || choice.addons.length > 0 ? (
                  <span className="block text-base text-muted">
                    {choiceLabels(dish, choice).join(" · ")}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        {(avoid.length > 0 || alsoAvoid.length > 0) && (
          <div className="mt-6 rounded-control border-2 border-tomato p-4">
            <AllergyStatement
              language={staffLanguage}
              avoid={avoid}
              alsoAvoid={alsoAvoid}
              severity={severity}
              large={false}
            />
          </div>
        )}
      </Sheet>
    );
  }

  if (mode === "split") {
    const billLines: BillLine[] = lines.map(({ key, dish, choice, quantity }) => ({
      price: linePrice(dish, choice),
      quantity,
      person: assignees[key] || null,
    }));
    const bill = splitBill(billLines, people, taxPercent / 100, tipPercent / 100);

    return (
      <Sheet title={t.splitBill} closeLabel={t.back} onClose={() => setMode("list")}>
        <fieldset className="mt-4">
          <legend className="text-sm font-medium">{t.people}</legend>
          {people.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {people.map((person) => (
                <span
                  key={person}
                  className="flex items-center gap-1 rounded-full py-1 ps-4 pe-1 text-sm shadow-pressed-sm"
                >
                  {person}
                  <button
                    aria-label={`${t.remove} ${person}`}
                    onClick={() => removePerson(person)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-muted transition-colors hover:text-tomato"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addPerson();
            }}
            className="mt-2 flex gap-2"
          >
            <input
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
              maxLength={30}
              placeholder={t.personPlaceholder}
              aria-label={t.personPlaceholder}
              className={fieldClass("flex-1")}
            />
            <Button type="submit" variant="secondary">
              {t.addPerson}
            </Button>
          </form>
        </fieldset>

        {people.length > 0 && (
          <ul className="mt-5 divide-y divide-line">
            {lines.map(({ key, dish, choice, quantity }) => (
              <li
                lang={dish.source_language ?? "und"}
                key={key}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  {quantity} × {textFor(dish).name}
                  {choice.size !== null || choice.addons.length > 0 ? (
                    <span className="block text-xs text-muted">
                      {choiceLabels(dish, choice, textFor(dish).options).join(" · ")}
                    </span>
                  ) : null}
                </span>
                <label className="shrink-0">
                  <span className="sr-only">{t.whoHad}</span>
                  <select
                    value={assignees[key] ?? ""}
                    onChange={(e) => setAssignees((prev) => ({ ...prev, [key]: e.target.value }))}
                    className={fieldClass("w-auto py-2.5")}
                  >
                    <option value="">{t.shared}</option>
                    {people.map((person) => (
                      <option key={person} value={person}>
                        {person}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-medium">{t.tax} (%)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={30}
              step={0.1}
              value={taxPercent}
              onChange={(e) => setTaxPercent(clampPercent(e.target.value))}
              className={fieldClass("mt-1")}
            />
          </label>
          <fieldset className="text-sm">
            <legend className="font-medium">{t.tip}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIP_OPTIONS.map((percent) => (
                <button
                  key={percent}
                  type="button"
                  aria-pressed={tipPercent === percent}
                  onClick={() => setTipPercent(percent)}
                  className={`rounded-control px-3 py-2.5 font-mono transition-[box-shadow,background-color,color] duration-200 ${
                    tipPercent === percent
                      ? "bg-ink text-white shadow-pressed-color"
                      : "bg-paper shadow-raised-sm hover:text-accent"
                  }`}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <dl className="mt-5 space-y-1 text-sm">
          <Row label={t.subtotal} value={money(bill.subtotal)} />
          <Row label={`${t.tax} (${taxPercent}%)`} value={money(bill.tax)} />
          <Row label={`${t.tip} (${tipPercent}%)`} value={money(bill.tip)} />
          <Row label={t.total} value={money(bill.total)} strong />
        </dl>

        {people.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="text-sm font-medium">{t.perPerson}</h3>
            <dl className="mt-2 space-y-1 text-sm">
              {people.map((person) => (
                <Row key={person} label={person} value={money(bill.perPerson[person] ?? 0)} />
              ))}
            </dl>
          </div>
        )}

        {bill.unpricedCount > 0 && <p className="mt-4 text-xs text-muted">{t.unpriced}</p>}
        <p className="mt-2 text-xs text-muted">{t.estimate}</p>
      </Sheet>
    );
  }

  return (
    <Sheet title={t.yourOrder} closeLabel={t.close} onClose={onClose}>
      {lines.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t.empty}</p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-line">
            {lines.map(({ key, dish, choice, quantity }) => {
              const chosen = choice.size !== null || choice.addons.length > 0;
              const price = chosen ? linePrice(dish, choice) : null;
              return (
                <li
                  lang={dish.source_language ?? "und"}
                  key={key}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{textFor(dish).name}</p>
                    {chosen && (
                      <p className="text-sm text-muted">
                        {choiceLabels(dish, choice, textFor(dish).options).join(" · ")}
                      </p>
                    )}
                    <p className="text-sm text-muted tabular-nums">
                      {price !== null ? money(price) : dish.price}
                    </p>
                  </div>
                  <QuantityStepper
                    quantity={quantity}
                    onChange={(next) => onQuantity(key, next)}
                    labels={t}
                  />
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={() => setMode("server")}>{t.showServer}</Button>
            <Button onClick={() => setMode("split")} variant="secondary">
              {t.splitBill}
            </Button>
            <Button onClick={onClear} variant="danger" size="sm" className="ms-auto">
              {t.clearOrder}
            </Button>
          </div>
        </>
      )}
      {onStartTogether && onLeaveTogether && (
        <OrderTogether
          t={t}
          code={tableCode}
          ended={tableEnded}
          onStart={onStartTogether}
          onLeave={onLeaveTogether}
        />
      )}
      {tableCode && onShareAllergies && (
        <TableAllergies
          language={language}
          staffLanguage={staffLanguage}
          mine={{ avoid, alsoAvoid, severity }}
          allergies={tableAllergies}
          me={myTableId}
          onShare={onShareAllergies}
        />
      )}
    </Sheet>
  );
}
