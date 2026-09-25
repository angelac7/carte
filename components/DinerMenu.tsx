"use client";
import { useEffect, useRef, useState } from "react";
import { AllergyCard } from "@/components/AllergyCard";
import { DishSheet } from "@/components/DishSheet";
import { DisplaySettings } from "@/components/DisplaySettings";
import {
  BagIcon,
  CameraIcon,
  ChatIcon,
  GlobeIcon,
  PersonIcon,
  ShieldIcon,
  SparkleIcon,
} from "@/components/icons";
import { DishCard } from "@/components/menu/DishCard";
import { FilterSheet } from "@/components/menu/FilterSheet";
import { MenuHero } from "@/components/menu/MenuHero";
import { MenuToolbar } from "@/components/menu/MenuToolbar";
import { SaveMenuButton } from "@/components/menu/SaveMenuButton";
import { MenuChat } from "@/components/MenuChat";
import { MenuDock } from "@/components/MenuDock";
import { MenuExtras } from "@/components/MenuExtras";
import OfflineLink from "@/components/OfflineLink";
import { OrderHelper } from "@/components/OrderHelper";
import { OrderSheet } from "@/components/OrderSheet";
import { PhotoLookup } from "@/components/PhotoLookup";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { type Allergen, type DietaryTag } from "@/lib/allergens";
import { fetchTranslations, trackDishView } from "@/lib/api-client";
import { useOffline } from "@/lib/use-offline";
import { useDinerPrefs } from "@/lib/use-diner-prefs";
import { type DinerPrefs } from "@/lib/diner-prefs";
import {
  applyDisplay,
  DEFAULT_DISPLAY,
  writeDisplayCookie,
  type DisplayPrefs,
} from "@/lib/display-prefs";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { DISH_STRINGS } from "@/lib/i18n/dish-strings";
import { DOCK_STRINGS } from "@/lib/i18n/dock-strings";
import { HELP_STRINGS } from "@/lib/i18n/help-strings";
import { MY_CARTE_STRINGS } from "@/lib/i18n/my-carte-strings";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import {
  htmlLang,
  isLanguageCode,
  LANGUAGE_COOKIE,
  LANGUAGES,
  type LanguageCode,
} from "@/lib/languages";
import { filterDishes } from "@/lib/menu-filters";
import { matchesSearch } from "@/lib/menu-search";
import { toggleValue } from "@/lib/toggle-value";
import type { DishText, MenuItem } from "@/types/menu";
import type { MenuTranslations } from "@/types/translation";

type TranslationState = Partial<Record<LanguageCode, MenuTranslations | "failed">>;
type Panel = "order" | "allergy-card" | "helper" | "display" | "chat" | "photo" | "filters" | null;

type DinerMenuProps = {
  restaurant: { name: string; slug: string; cuisine: string; city?: string };
  dishes: MenuItem[];
  initialLanguage: LanguageCode;
  initialPrefs: DinerPrefs;
  initialDisplay: DisplayPrefs;
  onPreferencesChange?: (preferences: {
    initialLanguage: LanguageCode;
    initialPrefs: DinerPrefs;
    initialDisplay: DisplayPrefs;
  }) => void;
};

/** The public menu diners see. Receives confirmed dishes only. */
export function DinerMenu({
  restaurant,
  dishes,
  initialLanguage,
  initialPrefs,
  initialDisplay,
  onPreferencesChange,
}: DinerMenuProps) {
  const offline = useOffline();
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);
  const [byLanguage, setByLanguage] = useState<TranslationState>({});
  const [prefs, setPrefs] = useDinerPrefs(initialPrefs);
  const { avoid, onlyTags } = prefs;
  const [order, setOrder] = useState<Record<string, number>>({});
  const [openDishId, setOpenDishId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  // Search only narrows the list on screen; the assistant and order still see every allowed dish.
  const [search, setSearch] = useState("");
  const [display, setDisplay] = useState<DisplayPrefs>(initialDisplay);
  const requested = useRef(new Set<LanguageCode>());
  const [translationAttempt, setTranslationAttempt] = useState(0);
  useEffect(() => {
    onPreferencesChange?.({
      initialLanguage: language,
      initialPrefs: prefs,
      initialDisplay: display,
    });
  }, [language, prefs, display, onPreferencesChange]);

  const sourceLanguage = dishes.find(
    (dish) => dish.source_language && isLanguageCode(dish.source_language),
  )?.source_language;
  const staffLanguage = sourceLanguage && isLanguageCode(sourceLanguage) ? sourceLanguage : "en";
  const needsTranslation = dishes.some((dish) => (dish.source_language ?? "en") !== language);

  // Fetch each language's translations once, the first time a diner picks it.
  useEffect(() => {
    if (!needsTranslation || requested.current.has(language)) return;
    requested.current.add(language);
    fetchTranslations(restaurant.slug, language)
      .then((result) => setByLanguage((prev) => ({ ...prev, [language]: result })))
      .catch(() => setByLanguage((prev) => ({ ...prev, [language]: "failed" })));
  }, [language, restaurant.slug, translationAttempt, needsTranslation]);

  // Larger text and high contrast apply to the whole page while this menu is open.
  useEffect(() => {
    applyDisplay(display);
    return () => applyDisplay(DEFAULT_DISPLAY);
  }, [display]);

  const t = DINER_STRINGS[language];
  const tableText = TABLE_STRINGS[language];
  const helpText = HELP_STRINGS[language];
  const dishText = DISH_STRINGS[language];
  const dockText = DOCK_STRINGS[language];
  const myCarteText = MY_CARTE_STRINGS[language];
  const status = !needsTranslation ? undefined : byLanguage[language];
  const translations = status && status !== "failed" ? status : undefined;
  const translating = needsTranslation && status === undefined;

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
    setPrefs({ avoid: nextAvoid, onlyTags: nextOnlyTags });
  }

  function openDetails(dishId: string) {
    setPanel(null);
    setOpenDishId(dishId);
    trackDishView(dishId);
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
  const shownIds = new Set(shown.map((dish) => dish.id));
  const filteredOrder = Object.fromEntries(
    Object.entries(order).filter(([id]) => shownIds.has(id)),
  );
  const excludedOrder = Object.keys(order).some((id) => !shownIds.has(id));
  const openDish = shown.find((dish) => dish.id === openDishId);
  const orderCount = Object.values(filteredOrder).reduce((sum, quantity) => sum + quantity, 0);
  const cover = dishes.find((dish) => dish.photo_url)?.photo_url ?? null;

  const query = search.trim();
  const listed = shown.filter((dish) => {
    const text = textFor(dish);
    return matchesSearch([text.name, dish.name, text.description, text.notes], query);
  });
  const details = [
    ...new Set([restaurant.cuisine, restaurant.city ?? ""].map((d) => d.trim())),
  ].filter(Boolean);
  const glassClass =
    "flex h-11 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 text-sm font-medium text-white backdrop-blur transition-colors hover:border-white/60";

  const hero = (
    <MenuHero
      name={restaurant.name}
      details={details}
      cover={dishes.length > 0 ? cover : null}
      summary={`${t.menuTitle} · ${t.dishCount(dishes.length)}`}
      lead={
        <OfflineLink href="/my" className={glassClass}>
          <span aria-hidden="true" className="h-5 w-5">
            <PersonIcon />
          </span>
          <span className="sr-only sm:not-sr-only">{myCarteText.myCarte}</span>
        </OfflineLink>
      }
      controls={
        <>
          <label className={glassClass}>
            <span aria-hidden="true" className="h-5 w-5">
              <GlobeIcon />
            </span>
            <span className="sr-only">{t.language}</span>
            <select
              value={language}
              onChange={(e) => chooseLanguage(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none [&>option]:text-ink"
            >
              {LANGUAGES.map((option) => (
                <option key={option.code} value={option.code} lang={option.htmlLang}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setPanel("display")}
            aria-label={helpText.display}
            className={`${glassClass} font-serif text-base`}
          >
            Aa
          </button>
          <SaveMenuButton restaurant={restaurant} language={language} />
        </>
      }
    />
  );

  if (dishes.length === 0) {
    return (
      <div lang={htmlLang(language)}>
        {hero}
        <main id="main" className="mx-auto max-w-5xl px-5 py-12">
          <EmptyState>{t.notReady}</EmptyState>
        </main>
        {panel === "display" && (
          <DisplaySettings
            language={language}
            display={display}
            onChange={(next) => {
              setDisplay(next);
              writeDisplayCookie(next);
            }}
            onClose={() => setPanel(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div lang={htmlLang(language)}>
      {hero}

      <main id="main" className="mx-auto max-w-5xl px-5 pb-36">
        <MenuToolbar
          t={t}
          query={search}
          onQuery={setSearch}
          avoid={avoid}
          onlyTags={onlyTags}
          onOpenFilters={() => setPanel("filters")}
          onRemoveAllergen={(allergen) => updateFilters(toggleValue(avoid, allergen), onlyTags)}
          onRemoveTag={(tag) => updateFilters(avoid, toggleValue(onlyTags, tag))}
          onClearFilters={() => updateFilters([], [])}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-3">
            <Notice>{t.safetyNotice}</Notice>
            {offline && (
              <Notice tone="warning" role="alert">
                {t.offlineMenu}
              </Notice>
            )}
            {excludedOrder && (
              <Notice tone="warning" role="status">
                {t.orderFiltered}
              </Notice>
            )}
            {translating && (
              <p role="status" className="text-sm text-muted">
                {t.translating}
              </p>
            )}
            {status === "failed" && (
              <p role="alert" className="text-sm text-tomato">
                {t.translationFailed}{" "}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    requested.current.delete(language);
                    setByLanguage((previous) => {
                      const next = { ...previous };
                      delete next[language];
                      return next;
                    });
                    setTranslationAttempt((attempt) => attempt + 1);
                  }}
                >
                  {t.retryTranslation}
                </Button>
              </p>
            )}
            {translations && <p className="text-sm text-muted">{t.translatedNote}</p>}
          </div>

          {/* The ordering assistant, set in ink so it stands out from the dishes. */}
          <button
            type="button"
            onClick={() => setPanel("helper")}
            className="texture-ink group flex w-full items-center gap-5 rounded-panel p-6 text-left text-white shadow-raised transition-transform duration-200 hover:-translate-y-0.5 sm:p-7"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent shadow-pressed-color">
              <span aria-hidden="true" className="h-6 w-6">
                <SparkleIcon />
              </span>
            </span>
            <span className="min-w-0">
              <span className="block font-serif text-2xl leading-tight tracking-tight">
                {helpText.helperButton}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-white/70">
                {t.helperPitch}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="ml-auto text-2xl transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </button>
        </div>

        <MenuExtras
          restaurant={restaurant}
          language={language}
          menuSize={dishes.length}
          candidates={shown}
          textFor={textFor}
          onOpenDish={openDetails}
        />

        <section aria-labelledby="menu-heading" className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3 border-t-4 border-ink pt-6">
            <h2
              id="menu-heading"
              className="font-serif text-4xl leading-none tracking-tighter sm:text-5xl"
            >
              {t.menuTitle}
            </h2>
            <p aria-live="polite" className="text-sm text-muted">
              {filtering || query
                ? t.showing(listed.length, dishes.length, hiddenCount)
                : t.dishCount(dishes.length)}
            </p>
          </div>

          {shown.length === 0 ? (
            <EmptyState className="mt-8">
              <p>{t.noMatch}</p>
              <Button variant="secondary" onClick={() => updateFilters([], [])} className="mt-5">
                {t.clearFilters}
              </Button>
            </EmptyState>
          ) : listed.length === 0 ? (
            <EmptyState className="mt-8">
              <p>{t.noSearchMatch(query)}</p>
              <Button variant="secondary" onClick={() => setSearch("")} className="mt-5">
                {t.clearSearch}
              </Button>
            </EmptyState>
          ) : (
            <ul className="mt-8 grid gap-6 lg:grid-cols-2">
              {listed.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  text={textFor(dish)}
                  t={t}
                  detailsLabel={dishText.details}
                  stepperLabels={tableText}
                  restaurant={restaurant}
                  language={language}
                  quantity={order[dish.id] ?? 0}
                  onQuantity={(quantity) => setQuantity(dish.id, quantity)}
                  onOpen={() => openDetails(dish.id)}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <MenuDock
        label={dockText.label}
        items={[
          {
            id: "order",
            label: dockText.order,
            icon: <BagIcon />,
            badge: orderCount,
            onClick: () => setPanel("order"),
          },
          { id: "ask", label: dockText.ask, icon: <ChatIcon />, onClick: () => setPanel("chat") },
          {
            id: "photo",
            label: dockText.photo,
            icon: <CameraIcon />,
            onClick: () => setPanel("photo"),
          },
          {
            id: "allergies",
            label: dockText.allergies,
            icon: <ShieldIcon />,
            badge: avoid.length,
            onClick: () => setPanel("allergy-card"),
          },
        ]}
      />

      {panel === "filters" && (
        <FilterSheet
          t={t}
          closeLabel={tableText.close}
          avoid={avoid}
          onlyTags={onlyTags}
          shownCount={shown.length}
          onChange={updateFilters}
          onClose={() => setPanel(null)}
        />
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
          staffLanguage={staffLanguage}
          dishes={shown}
          order={filteredOrder}
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
          staffLanguage={staffLanguage}
          language={language}
          avoid={avoid}
          onToggle={(allergen) => updateFilters(toggleValue(avoid, allergen), onlyTags)}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "helper" && (
        <OrderHelper
          key={JSON.stringify([language, avoid, onlyTags])}
          restaurantSlug={restaurant.slug}
          language={language}
          dishes={shown}
          avoid={avoid}
          onlyTags={onlyTags}
          order={filteredOrder}
          textFor={textFor}
          onQuantity={setQuantity}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "display" && (
        <DisplaySettings
          language={language}
          display={display}
          onChange={(next) => {
            setDisplay(next);
            writeDisplayCookie(next);
          }}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "photo" && (
        <PhotoLookup
          key={JSON.stringify([language, avoid, onlyTags])}
          avoid={avoid}
          onlyTags={onlyTags}
          restaurantSlug={restaurant.slug}
          language={language}
          dishes={dishes}
          visibleIds={new Set(shown.map((dish) => dish.id))}
          textFor={textFor}
          onOpenDish={openDetails}
          onClose={() => setPanel(null)}
        />
      )}
      <MenuChat
        key={JSON.stringify([restaurant.slug, language, avoid, onlyTags])}
        avoid={avoid}
        onlyTags={onlyTags}
        language={language}
        restaurantSlug={restaurant.slug}
        open={panel === "chat"}
        onClose={() => setPanel(null)}
      />
    </div>
  );
}
