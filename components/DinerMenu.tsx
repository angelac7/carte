"use client";
import { useEffect, useRef, useState } from "react";
import { AllergyCard } from "@/components/AllergyCard";
import { Chip } from "@/components/Chip";
import { DishHeader } from "@/components/DishHeader";
import { DishSheet } from "@/components/DishSheet";
import { MenuChat } from "@/components/MenuChat";
import { OrderSheet } from "@/components/OrderSheet";
import { QuantityStepper } from "@/components/QuantityStepper";
import { ToggleChip } from "@/components/ToggleChip";
import { ALLERGENS, DIETARY_TAGS, type Allergen, type DietaryTag } from "@/lib/allergens";
import { fetchTranslations } from "@/lib/api-client";
import { writePrefsCookie, type DinerPrefs } from "@/lib/diner-prefs";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { DISH_STRINGS } from "@/lib/i18n/dish-strings";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import {
  htmlLang,
  isLanguageCode,
  LANGUAGE_COOKIE,
  LANGUAGES,
  ORIGINAL_LANGUAGE,
  type LanguageCode,
} from "@/lib/languages";
import { filterDishes } from "@/lib/menu-filters";
import { toggleValue } from "@/lib/toggle-value";
import type { DishText, MenuItem } from "@/types/menu";
import type { MenuTranslations } from "@/types/translation";

type TranslationState = Partial<Record<LanguageCode, MenuTranslations | "failed">>;
type Panel = "order" | "allergy-card" | null;

type DinerMenuProps = {
  restaurant: { name: string; slug: string };
  dishes: MenuItem[];
  initialLanguage: LanguageCode;
  initialPrefs: DinerPrefs;
};

/** The public menu diners see. Receives confirmed dishes only. */
export function DinerMenu({ restaurant, dishes, initialLanguage, initialPrefs }: DinerMenuProps) {
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);
  const [byLanguage, setByLanguage] = useState<TranslationState>({});
  const [avoid, setAvoid] = useState<Allergen[]>(initialPrefs.avoid);
  const [onlyTags, setOnlyTags] = useState<DietaryTag[]>(initialPrefs.onlyTags);
  const [order, setOrder] = useState<Record<string, number>>({});
  const [openDishId, setOpenDishId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const requested = useRef(new Set<LanguageCode>());

  // Fetch each language's translations once, the first time a diner picks it.
  useEffect(() => {
    if (language === ORIGINAL_LANGUAGE || requested.current.has(language)) return;
    requested.current.add(language);
    fetchTranslations(restaurant.slug, language)
      .then((result) => setByLanguage((prev) => ({ ...prev, [language]: result })))
      .catch(() => setByLanguage((prev) => ({ ...prev, [language]: "failed" })));
  }, [language, restaurant.slug]);

  const t = DINER_STRINGS[language];
  const tableText = TABLE_STRINGS[language];
  const status = language === ORIGINAL_LANGUAGE ? undefined : byLanguage[language];
  const translations = status && status !== "failed" ? status : undefined;
  const translating = language !== ORIGINAL_LANGUAGE && status === undefined;

  function chooseLanguage(value: string) {
    if (!isLanguageCode(value)) return;
    setLanguage(value);
    document.cookie = `${LANGUAGE_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  }

  function textFor(dish: MenuItem): DishText {
    const translated = translations?.[dish.id];
    return {
      name: translated?.name || dish.name,
      description: translated?.description || dish.description,
      notes: translated?.notes || dish.notes,
    };
  }

  // Filters are remembered on this device and applied at every Carte menu.
  function updateFilters(nextAvoid: Allergen[], nextOnlyTags: DietaryTag[]) {
    setAvoid(nextAvoid);
    setOnlyTags(nextOnlyTags);
    writePrefsCookie({ avoid: nextAvoid, onlyTags: nextOnlyTags });
  }

  function setQuantity(dishId: string, quantity: number) {
    setOrder((prev) => {
      const next = { ...prev };
      if (quantity > 0) next[dishId] = quantity;
      else delete next[dishId];
      return next;
    });
  }

  const shown = filterDishes(dishes, { avoid, onlyTags });
  const hiddenCount = dishes.length - shown.length;
  const filtering = avoid.length > 0 || onlyTags.length > 0;
  const openDish = dishes.find((dish) => dish.id === openDishId);
  const orderCount = Object.values(order).reduce((sum, quantity) => sum + quantity, 0);

  const languagePicker = (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">{t.language}</span>
      <select
        value={language}
        onChange={(e) => chooseLanguage(e.target.value)}
        className="rounded-md border border-line bg-card px-3 py-1.5 text-sm focus:border-ink"
      >
        {LANGUAGES.map((option) => (
          <option key={option.code} value={option.code} lang={option.htmlLang}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );

  if (dishes.length === 0) {
    return (
      <main lang={htmlLang(language)} className="mx-auto max-w-3xl px-5 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-4xl leading-tight">{restaurant.name}</h1>
          {languagePicker}
        </div>
        <p className="mt-4 text-muted">{t.notReady}</p>
      </main>
    );
  }

  return (
    <main lang={htmlLang(language)} className="mx-auto max-w-3xl px-5 pb-32">
      <div className="pt-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-4xl leading-tight">{restaurant.name}</h1>
          {languagePicker}
        </div>
        <p
          role="note"
          className="mt-4 rounded-md border border-saffron/40 bg-saffron-soft px-4 py-3 text-sm leading-relaxed text-saffron-ink"
        >
          {t.safetyNotice}
        </p>
        {translating && (
          <p role="status" className="mt-3 text-sm text-muted">
            {t.translating}
          </p>
        )}
        {status === "failed" && (
          <p role="alert" className="mt-3 text-sm text-tomato">
            {t.translationFailed}
          </p>
        )}
        {translations && <p className="mt-3 text-sm text-muted">{t.translatedNote}</p>}
      </div>

      <section
        aria-label={t.hideContaining}
        className="mt-8 rounded-lg border border-line bg-card p-5 sm:p-6"
      >
        <fieldset>
          <legend className="text-sm font-medium">{t.hideContaining}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALLERGENS.map((allergen) => (
              <ToggleChip
                key={allergen}
                label={t.allergens[allergen]}
                tone="ink"
                pressed={avoid.includes(allergen)}
                onToggle={() => updateFilters(toggleValue(avoid, allergen), onlyTags)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium">{t.showOnly}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIETARY_TAGS.map((tag) => (
              <ToggleChip
                key={tag}
                label={t.tags[tag]}
                tone="basil"
                pressed={onlyTags.includes(tag)}
                onToggle={() => updateFilters(avoid, toggleValue(onlyTags, tag))}
              />
            ))}
          </div>
        </fieldset>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4 text-sm">
          {filtering ? (
            <p aria-live="polite" className="text-muted">
              {t.showing(shown.length, dishes.length, hiddenCount)}
            </p>
          ) : (
            <span />
          )}
          <div className="flex gap-4">
            {filtering && (
              <button
                onClick={() => updateFilters([], [])}
                className="text-muted underline hover:text-ink"
              >
                {t.clearFilters}
              </button>
            )}
            <button
              onClick={() => setPanel("allergy-card")}
              className="font-medium underline underline-offset-4 hover:text-muted"
            >
              {tableText.allergyCard}
            </button>
          </div>
        </div>
      </section>

      {shown.length === 0 ? (
        <p className="mt-10 text-muted">{t.noMatch}</p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-card px-5 sm:px-6">
          {shown.map((dish) => {
            const text = textFor(dish);
            return (
              <li key={dish.id} className="py-5">
                <DishHeader name={text.name} price={dish.price} as="h2" />
                {text.name !== dish.name && (
                  <p lang="en" className="mt-0.5 text-xs text-muted">
                    {dish.name}
                  </p>
                )}
                <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
                  {text.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {dish.allergens.length > 0 ? (
                    <>
                      <span className="text-muted">{t.contains}</span>
                      {dish.allergens.map((allergen) => (
                        <Chip key={allergen} label={t.allergens[allergen]} tone="allergen" />
                      ))}
                    </>
                  ) : (
                    <span className="text-muted">{t.noMajorAllergens}</span>
                  )}
                  {dish.dietary_tags.map((tag) => (
                    <Chip key={tag} label={t.tags[tag]} tone="tag" />
                  ))}
                </div>
                {text.notes && (
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-medium">{t.kitchenNote}</span> {text.notes}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between gap-4">
                  <button
                    onClick={() => setOpenDishId(dish.id)}
                    className="text-sm font-medium underline underline-offset-4 hover:text-muted"
                  >
                    {DISH_STRINGS[language].details}
                  </button>
                  <QuantityStepper
                    quantity={order[dish.id] ?? 0}
                    onChange={(quantity) => setQuantity(dish.id, quantity)}
                    labels={tableText}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {orderCount > 0 && (
        <button
          onClick={() => setPanel("order")}
          className="fixed bottom-5 left-5 z-20 rounded-full border border-ink bg-card px-5 py-3 text-sm font-medium shadow-lg hover:bg-paper print:hidden"
        >
          {tableText.yourOrder} ({orderCount})
        </button>
      )}

      {openDish && (
        <DishSheet
          key={openDish.id}
          dish={openDish}
          text={textFor(openDish)}
          language={language}
          restaurantSlug={restaurant.slug}
          onClose={() => setOpenDishId(null)}
        />
      )}
      {panel === "order" && (
        <OrderSheet
          dishes={dishes}
          order={order}
          textFor={textFor}
          language={language}
          avoid={avoid}
          onQuantity={setQuantity}
          onClear={() => setOrder({})}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "allergy-card" && (
        <AllergyCard
          language={language}
          avoid={avoid}
          onToggle={(allergen) => updateFilters(toggleValue(avoid, allergen), onlyTags)}
          onClose={() => setPanel(null)}
        />
      )}
      <MenuChat language={language} restaurantSlug={restaurant.slug} />
    </main>
  );
}
