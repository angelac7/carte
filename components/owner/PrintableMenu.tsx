import {
  allergensChecked,
  KITCHEN_PRACTICES,
  type Allergen,
  type KitchenPractice,
} from "@/lib/allergens";
import { formatList } from "@/lib/format-list";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { htmlLang, textDirection, type LanguageCode } from "@/lib/languages";
import { groupBySection } from "@/lib/menu-sections";
import { formatCalories } from "@/lib/prices";
import type { MenuItem } from "@/types/menu";
import type { MenuTranslations } from "@/types/translation";

type PrintableMenuProps = {
  restaurantName: string;
  kitchenPractices?: KitchenPractice[];
  dishes: MenuItem[];
  language: LanguageCode;
  translations: MenuTranslations;
  qrSrc: string;
  menuUrl: string;
  printedOn: string;
};

/**
 * A paper menu of the confirmed dishes, laid out for printing. Allergen names use Carte's fixed
 * translations; dish text uses saved translations and falls back to the original.
 */
export function PrintableMenu({
  restaurantName,
  kitchenPractices = [],
  dishes,
  language,
  translations,
  qrSrc,
  menuUrl,
  printedOn,
}: PrintableMenuProps) {
  const t = DINER_STRINGS[language];
  const names = (allergens: readonly Allergen[]) =>
    formatList(
      allergens.map((allergen) => t.allergens[allergen]),
      language,
    );
  const text = (dish: MenuItem) => translations[dish.id];
  const specials = dishes.filter((dish) => dish.special);
  const groups = [
    ...(specials.length ? [{ section: t.specials, dishes: specials }] : []),
    ...groupBySection(dishes.filter((dish) => !dish.special)).map((group) => ({
      section: group.section
        ? text(group.dishes[0])?.section || group.section
        : groupBySection(dishes).length > 1
          ? t.otherDishes
          : "",
      dishes: group.dishes,
    })),
  ];

  return (
    <article
      lang={htmlLang(language)}
      dir={textDirection(language)}
      className="rounded-panel bg-white p-8 text-ink shadow-raised sm:p-12 print:rounded-none print:p-0 print:shadow-none"
    >
      <header className="border-b-4 border-ink pb-6">
        <h1 className="font-serif text-6xl leading-none tracking-tighter">{restaurantName}</h1>
        <p className="eyebrow mt-3 text-muted">{t.menuTitle}</p>
        {kitchenPractices.length > 0 && (
          <div className="mt-4 text-sm">
            <p className="font-medium">{t.kitchenTitle}</p>
            <ul className="mt-1 list-disc ps-5">
              {KITCHEN_PRACTICES.filter((p) => kitchenPractices.includes(p)).map((practice) => (
                <li key={practice}>{t.kitchenPractices[practice]}</li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {groups.map((group) => (
        <section key={group.section || "menu"} className="mt-8 break-inside-avoid-page">
          {group.section && (
            <h2 className="border-b border-ink/20 pb-1 font-serif text-3xl tracking-tight">
              {group.section}
            </h2>
          )}
          <ul className="mt-4 space-y-5">
            {group.dishes.map((dish) => {
              const translated = text(dish);
              const options = translated?.options ?? [];
              return (
                <li key={dish.id} className="break-inside-avoid">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-serif text-xl">
                      {translated?.name || dish.name}
                      {translated?.name && translated.name !== dish.name && (
                        <span className="ms-2 text-sm text-muted">{dish.name}</span>
                      )}
                    </h3>
                    <span className="shrink-0 font-mono tabular-nums">
                      {dish.price}
                      {dish.calories != null &&
                        ` · ${t.calories(formatCalories(dish.calories, htmlLang(language)))}`}
                    </span>
                  </div>
                  {(translated?.description || dish.description) && (
                    <p className="mt-0.5 text-sm text-muted">
                      {translated?.description || dish.description}
                    </p>
                  )}
                  {(dish.sizes?.length ?? 0) > 0 && (
                    <p className="mt-1 text-sm">
                      {dish
                        .sizes!.map((size, i) => `${options[i] || size.label} ${size.price}`)
                        .join(" · ")}
                    </p>
                  )}
                  {(dish.addons?.length ?? 0) > 0 && (
                    <p className="mt-1 text-sm">
                      {t.addons}:{" "}
                      {dish
                        .addons!.map((addon, i) => {
                          const label = options[(dish.sizes?.length ?? 0) + i] || addon.label;
                          const price = addon.price ? ` +${addon.price}` : "";
                          const contains = addon.allergens.length
                            ? ` (${t.contains}: ${names(addon.allergens)})`
                            : "";
                          return `${label}${price}${contains}`;
                        })
                        .join(" · ")}
                    </p>
                  )}
                  <p className="mt-1 text-sm font-medium">
                    {dish.allergens.length > 0
                      ? `${t.contains}: ${names(dish.allergens)}`
                      : t.noMajorAllergens(allergensChecked(dish.allergen_list))}
                    {(dish.may_contain?.length ?? 0) > 0 &&
                      ` · ${t.mayContain}: ${names(dish.may_contain!)}`}
                    {(dish.removable?.length ?? 0) > 0 &&
                      ` · ${t.canBeWithout}: ${names(dish.removable!)}`}
                    {(dish.also_contains?.length ?? 0) > 0 &&
                      ` · ${t.alsoContains}: ${formatList(
                        dish.also_contains!.map((item) => t.alsoAvoid[item]),
                        language,
                      )}`}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <footer className="mt-10 flex items-center gap-6 border-t-4 border-ink pt-6 break-inside-avoid">
        {/* A data URL, so Next's image optimizer isn't needed */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrSrc} alt="" className="h-28 w-28 shrink-0" />
        <div className="text-sm">
          <p className="font-medium">{t.safetyNotice}</p>
          {dishes.some((dish) => dish.calories != null) && (
            <p className="mt-1 text-xs">{t.caloriesNote}</p>
          )}
          <p className="mt-2 font-mono text-xs break-all text-muted">{menuUrl}</p>
          <p className="mt-1 text-xs text-muted">{printedOn}</p>
        </div>
      </footer>
    </article>
  );
}
