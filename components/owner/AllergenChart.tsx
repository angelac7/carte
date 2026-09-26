import { Fragment } from "react";
import { ALLERGENS, KITCHEN_PRACTICES, OTHER_AVOIDS, type KitchenPractice } from "@/lib/allergens";
import { allergenCell, CELL_MARKS, otherCell, type ChartCell } from "@/lib/allergen-chart";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import { htmlLang, textDirection, type LanguageCode } from "@/lib/languages";
import { groupBySection } from "@/lib/menu-sections";
import type { MenuItem } from "@/types/menu";

type AllergenChartProps = {
  restaurantName: string;
  dishes: MenuItem[];
  language: LanguageCode;
  kitchenPractices?: KitchenPractice[];
  printedOn: string;
};

const headerCell = "border-s border-ink/20 px-1 pb-2 align-bottom font-medium";
const markCell = "border-s border-ink/20 px-1 py-1.5 text-center text-base leading-none";

/**
 * A grid of every confirmed dish against the 14 allergens, for the kitchen wall. Dish names stay
 * as the kitchen knows them; headings and allergen names use fixed translations.
 */
export function AllergenChart({
  restaurantName,
  dishes,
  language,
  kitchenPractices = [],
  printedOn,
}: AllergenChartProps) {
  const t = TABLE_STRINGS[language];
  const d = DINER_STRINGS[language];
  // Other things diners avoid only appear once the owner has checked some dishes for them.
  const showOthers = dishes.some(
    (dish) => dish.also_checked || (dish.also_contains?.length ?? 0) > 0,
  );
  const columns = 1 + ALLERGENS.length + (showOthers ? OTHER_AVOIDS.length : 0);
  const cellLabel: Record<ChartCell, string> = {
    contains: t.legendContains,
    removable: t.legendRemovable,
    "may-contain": t.legendMayContain,
    unchecked: t.legendUnchecked,
    none: "",
  };
  const mark = (cell: ChartCell) => (
    <>
      <span aria-hidden="true">{CELL_MARKS[cell]}</span>
      {cell !== "none" && <span className="sr-only">{cellLabel[cell]}</span>}
    </>
  );

  return (
    <article
      lang={htmlLang(language)}
      dir={textDirection(language)}
      className="rounded-panel bg-white p-6 text-ink shadow-raised sm:p-8 print:rounded-none print:p-0 print:shadow-none"
    >
      <header className="border-b-4 border-ink pb-4">
        <h1 className="font-serif text-4xl leading-none tracking-tighter">{restaurantName}</h1>
        <p className="mt-2 text-lg font-medium">{t.chartTitle}</p>
        <p className="mt-1 text-sm text-muted">{t.chartIntro}</p>
        {kitchenPractices.length > 0 && (
          <div className="mt-3 text-sm">
            <p className="font-medium">{d.kitchenTitle}</p>
            <ul className="mt-1 list-disc ps-5">
              {KITCHEN_PRACTICES.filter((p) => kitchenPractices.includes(p)).map((practice) => (
                <li key={practice}>{d.kitchenPractices[practice]}</li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <div className="mt-4 overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-ink">
              <th scope="col" className="px-2 pb-2 text-start align-bottom">
                {t.chartDish}
              </th>
              {ALLERGENS.map((allergen) => (
                <th key={allergen} scope="col" className={headerCell}>
                  <span className="inline-block rotate-180 text-xs whitespace-nowrap [writing-mode:vertical-rl]">
                    {d.allergens[allergen]}
                  </span>
                </th>
              ))}
              {showOthers &&
                OTHER_AVOIDS.map((item, index) => (
                  <th
                    key={item}
                    scope="col"
                    className={`${headerCell} ${index === 0 ? "border-s-2 border-s-ink" : ""}`}
                  >
                    <span className="inline-block rotate-180 text-xs whitespace-nowrap text-muted [writing-mode:vertical-rl]">
                      {d.alsoAvoid[item]}
                    </span>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {groupBySection(dishes).map((group) => (
              <Fragment key={group.section || "menu"}>
                {group.section && (
                  <tr className="break-inside-avoid">
                    <th
                      colSpan={columns}
                      scope="colgroup"
                      className="bg-ink/5 px-2 py-1 text-start font-semibold"
                    >
                      {group.section}
                    </th>
                  </tr>
                )}
                {group.dishes.map((dish) => (
                  <tr key={dish.id} className="break-inside-avoid border-t border-ink/15">
                    <th scope="row" className="px-2 py-1.5 text-start font-medium">
                      {dish.name}
                    </th>
                    {ALLERGENS.map((allergen) => (
                      <td key={allergen} className={markCell}>
                        {mark(allergenCell(dish, allergen))}
                      </td>
                    ))}
                    {showOthers &&
                      OTHER_AVOIDS.map((item, index) => (
                        <td
                          key={item}
                          className={`${markCell} ${index === 0 ? "border-s-2 border-s-ink" : ""}`}
                        >
                          {mark(otherCell(dish, item))}
                        </td>
                      ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="mt-5 flex flex-wrap gap-x-6 gap-y-1 border-t-2 border-ink pt-3 text-sm break-inside-avoid">
        {(["contains", "removable", "may-contain", "unchecked"] as const).map((cell) => (
          <span key={cell}>
            <span aria-hidden="true" className="me-1.5 inline-block w-4 text-center">
              {CELL_MARKS[cell]}
            </span>
            {cellLabel[cell]}
          </span>
        ))}
        <span className="ms-auto text-xs text-muted">{printedOn}</span>
      </footer>
    </article>
  );
}
