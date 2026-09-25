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
import { DishChoiceSheet } from "@/components/menu/DishChoiceSheet";
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
import { uncheckedAllergens, type Allergen, type DietaryTag } from "@/lib/allergens";
import { fetchSummaries, fetchTranslations, trackDishView } from "@/lib/api-client";
import { useOffline } from "@/lib/use-offline";
import { useTableOrder } from "@/lib/use-table-order";
import { useDinerPrefs } from "@/lib/use-diner-prefs";
import { type DinerPrefs } from "@/lib/diner-prefs";
import {
  applyDisplay,
  DEFAULT_DISPLAY,
  writeDisplayCookie,
  type DisplayPrefs,
} from "@/lib/display-prefs";
import { summaryKey, type DishSummaries } from "@/lib/dish-summaries";
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
import { formatList } from "@/lib/format-list";
import { matchesSearch } from "@/lib/menu-search";
import { blockedAddons, dishQuantity, hasChoices, lineKey, parseLineKey } from "@/lib/order-lines";
import { priceSteps, startingPrice, withinComfort } from "@/lib/comfort-filters";
import { detectCurrency, formatWhole } from "@/lib/prices";
import { groupBySection, hasSections } from "@/lib/menu-sections";
import { dishAvailability, restaurantClock, shortTime } from "@/lib/availability";
import { toggleValue } from "@/lib/toggle-value";
import type { DishText, MenuItem } from "@/types/menu";
import type { MenuTranslations } from "@/types/translation";

type TranslationState = Partial<Record<LanguageCode, MenuTranslations | "failed">>;
type Panel = "order" | "allergy-card" | "helper" | "display" | "chat" | "photo" | "filters" | null;

type DinerMenuProps = {
  restaurant: {
    name: string;
    slug: string;
    cuisine: string;
    city?: string;
    timezone?: string;
    phone?: string;
    website?: string;
    reservation_url?: string;
    price_range?: number;
    logo_url?: string | null;
    cover_url?: string | null;
  };
  dishes: MenuItem[];
  /** When the page was made, so the server and browser agree on what's available at first. */
  initialNow?: number;
  initialLanguage: LanguageCode;
  initialPrefs: DinerPrefs;
  initialDisplay: DisplayPrefs;
  /** One-line dish explanations already written in the initial language. */
  initialSummaries?: DishSummaries;
  /** The restaurant's most-opened dishes this month, from anonymous view counts. */
  popularIds?: string[];
  /** A shared table order to join, from a friend's link. */
  initialTableCode?: string | null;
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
  initialSummaries = {},
  popularIds = [],
  initialTableCode = null,
  initialNow,
  onPreferencesChange,
}: DinerMenuProps) {
  const offline = useOffline();
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);
  const [byLanguage, setByLanguage] = useState<TranslationState>({});
  const [prefs, setPrefs] = useDinerPrefs(initialPrefs);
  const { avoid, onlyTags } = prefs;
  const table = useTableOrder(restaurant.slug, initialTableCode);
  const { order, setQuantity } = table;
  const [openDishId, setOpenDishId] = useState<string | null>(null);
  // Price limits suit one menu's prices, so unlike spice they aren't remembered across menus.
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  // The dish whose size and add-ons are being picked before it's added.
  const [choosingId, setChoosingId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  // Search only narrows the list on screen; the assistant and order still see every allowed dish.
  const [search, setSearch] = useState("");
  const [display, setDisplay] = useState<DisplayPrefs>(initialDisplay);
  const requested = useRef(new Set<LanguageCode>());
  const [translationAttempt, setTranslationAttempt] = useState(0);
  const [summaries, setSummaries] = useState<Partial<Record<LanguageCode, DishSummaries>>>({
    [initialLanguage]: initialSummaries,
  });
  const summariesRequested = useRef(new Set<LanguageCode>([initialLanguage]));
  // Sold-out dishes and serving times follow the restaurant's clock, checked every minute.
  const [now, setNow] = useState(() => (initialNow ? new Date(initialNow) : new Date()));
  useEffect(() => {
    // Catch up right away too: a saved offline copy of the menu may be hours old.
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  const clock = restaurantClock(restaurant.timezone ?? "America/New_York", now);
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

  // Load the short explanations already written in a language the first time it's picked.
  useEffect(() => {
    if (summariesRequested.current.has(language)) return;
    summariesRequested.current.add(language);
    fetchSummaries(restaurant.slug, language)
      .then((found) =>
        setSummaries((prev) => ({ ...prev, [language]: { ...found, ...prev[language] } })),
      )
      .catch(() => {});
  }, [language, restaurant.slug]);

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
      options: translated?.options,
      section: translated?.section || dish.section || "",
    };
  }

  // Clears everything shown as a pill, in one save so no setting overwrites another.
  function clearAllFilters() {
    setPrefs({ ...prefs, avoid: [], onlyTags: [], maxSpice: undefined });
    setMaxPrice(null);
  }

  // Filters are remembered on this device and applied at every Carte menu.
  function updateFilters(nextAvoid: Allergen[], nextOnlyTags: DietaryTag[]) {
    setPrefs({ ...prefs, avoid: nextAvoid, onlyTags: nextOnlyTags });
  }

  function openDetails(dishId: string) {
    setPanel(null);
    setOpenDishId(dishId);
    trackDishView(dishId);
  }

  // Once a diner opens a dish, its card shows the explanation's summary too.
  function rememberSummary(dish: MenuItem, summary: string) {
    if (!summary) return;
    setSummaries((prev) => ({
      ...prev,
      [language]: { ...prev[language], [summaryKey(dish)]: summary },
    }));
  }

  // The menu itself shows dishes that need an allergen left out, or may contain traces, with
  // labels saying so. AI features never get those dishes.
  const shown = filterDishes(
    dishes,
    { avoid, onlyTags },
    { allowRemovable: true, allowTraces: !prefs.hideTraces },
  );
  // Dishes hidden only because they were never checked for an allergen this diner avoids.
  const uncheckedDishes = dishes.filter(
    (dish) =>
      uncheckedAllergens(dish.allergen_list, avoid).length > 0 &&
      !dish.allergens.some((allergen) => avoid.includes(allergen)),
  );
  const uncheckedCount = uncheckedDishes.length;
  const uncheckedNames = [
    ...new Set(uncheckedDishes.flatMap((dish) => uncheckedAllergens(dish.allergen_list, avoid))),
  ];
  const hiddenCount = dishes.length - shown.length;
  const filtering = avoid.length > 0 || onlyTags.length > 0;
  const shownById = new Map(shown.map((dish) => [dish.id, dish]));
  // A line stays in the order only while its dish, and every add-on on it, passes the filters.
  const lineAllowed = (key: string) => {
    const { dishId, choice } = parseLineKey(key);
    const dish = shownById.get(dishId);
    if (!dish) return false;
    const blocked = blockedAddons(dish, avoid);
    return !choice.addons.some((index) => blocked.includes(index));
  };
  const filteredOrder = Object.fromEntries(
    Object.entries(order).filter(([key]) => lineAllowed(key)),
  );
  const excludedOrder = Object.keys(order).some((key) => !lineAllowed(key));
  const currency = detectCurrency(dishes.map((dish) => dish.price));
  const choosingDish = shown.find((dish) => dish.id === choosingId);
  const openDish = shown.find((dish) => dish.id === openDishId);
  const orderCount = Object.values(filteredOrder).reduce((sum, quantity) => sum + quantity, 0);
  const cover = restaurant.cover_url || (dishes.find((dish) => dish.photo_url)?.photo_url ?? null);

  const query = search.trim();
  // Spice and price narrow what's listed, but never change the order or what AI features see.
  const steps = priceSteps(dishes.map(startingPrice));
  const comfortable = withinComfort(shown, {
    maxSpice: prefs.maxSpice ?? null,
    maxPrice: steps.includes(maxPrice ?? -1) ? maxPrice : null,
  });
  const listed = comfortable.filter((dish) => {
    const text = textFor(dish);
    return matchesSearch([text.name, dish.name, text.description, text.notes], query);
  });
  // Specials first, then menu headings in the owner's order. A search keeps the same grouping.
  const specials = listed.filter((dish) => dish.special);
  const groups = [
    ...(specials.length > 0 ? [{ section: "", special: true, dishes: specials }] : []),
    ...groupBySection(listed.filter((dish) => !dish.special)).map((group) => ({
      ...group,
      special: false,
    })),
  ];
  const sectioned = specials.length > 0 || hasSections(groups);
  const sectionId = (index: number) => `menu-section-${index}`;
  const sectionTitle = (group: (typeof groups)[number]) =>
    group.special
      ? t.specials
      : group.section
        ? textFor(group.dishes[0]).section || group.section
        : t.otherDishes;
  const priceRange = restaurant.price_range ? currency.repeat(restaurant.price_range) : "";
  const details = [
    ...new Set([restaurant.cuisine, restaurant.city ?? "", priceRange].map((d) => d.trim())),
  ].filter(Boolean);
  const glassClass =
    "flex h-11 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 text-sm font-medium text-white backdrop-blur transition-colors hover:border-white/60";

  const hero = (
    <MenuHero
      name={restaurant.name}
      details={details}
      cover={cover}
      logo={restaurant.logo_url ?? null}
      actions={
        <>
          {restaurant.reservation_url && (
            <a
              href={restaurant.reservation_url}
              target="_blank"
              rel="noopener noreferrer"
              className={glassClass}
            >
              {t.reserve}
            </a>
          )}
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone.replace(/[^\d+]/g, "")}`} className={glassClass}>
              {t.call}
            </a>
          )}
          {restaurant.website && (
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className={glassClass}
            >
              {t.website}
            </a>
          )}
        </>
      }
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
          onClearFilters={clearAllFilters}
          extraPills={[
            ...(prefs.maxSpice !== undefined
              ? [
                  {
                    label: t.spiceLimits[prefs.maxSpice],
                    onRemove: () => setPrefs({ ...prefs, maxSpice: undefined }),
                  },
                ]
              : []),
            ...(maxPrice !== null
              ? [
                  {
                    label: t.priceUnder(formatWhole(maxPrice, currency)),
                    onRemove: () => setMaxPrice(null),
                  },
                ]
              : []),
          ]}
          sections={
            sectioned
              ? groups.map((group, index) => ({ id: sectionId(index), label: sectionTitle(group) }))
              : []
          }
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-3">
            <Notice>{t.safetyNotice}</Notice>
            {uncheckedCount > 0 && (
              <Notice>
                {t.uncheckedHidden(
                  uncheckedCount,
                  formatList(
                    uncheckedNames.map((allergen) => t.allergens[allergen]),
                    language,
                  ),
                )}
              </Notice>
            )}
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
            <div className="mt-8 space-y-14">
              {groups.map((group, index) => (
                <section
                  key={group.special ? "specials" : group.section || "other"}
                  id={sectionId(index)}
                  aria-label={sectioned ? sectionTitle(group) : undefined}
                  className="scroll-mt-48"
                >
                  {sectioned && (
                    <h2 className="mb-5 font-serif text-3xl leading-none tracking-tight sm:text-4xl">
                      {sectionTitle(group)}
                    </h2>
                  )}
                  <ul className="grid gap-6 lg:grid-cols-2">
                    {group.dishes.map((dish) => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        text={textFor(dish)}
                        summary={summaries[language]?.[summaryKey(dish)]}
                        spiceLabel={dish.spice ? dishText.spiceLevels[dish.spice] : ""}
                        popular={popularIds.includes(dish.id)}
                        availability={dishAvailability(dish, clock)}
                        servingWindow={
                          dish.available_from && dish.available_until
                            ? t.servedBetween(
                                shortTime(dish.available_from),
                                shortTime(dish.available_until),
                              )
                            : ""
                        }
                        t={t}
                        avoid={avoid}
                        detailsLabel={dishText.details}
                        explainLabel={dishText.explainLink}
                        stepperLabels={tableText}
                        restaurant={restaurant}
                        language={language}
                        quantity={dishQuantity(filteredOrder, dish.id)}
                        onQuantity={(quantity) => setQuantity(dish.id, quantity)}
                        onChoose={hasChoices(dish) ? () => setChoosingId(dish.id) : undefined}
                        onOpen={() => openDetails(dish.id)}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
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
          shownCount={comfortable.length}
          hideTraces={prefs.hideTraces}
          onHideTraces={(hideTraces) => setPrefs({ ...prefs, hideTraces })}
          maxSpice={prefs.maxSpice}
          onMaxSpice={(maxSpice) => setPrefs({ ...prefs, maxSpice })}
          priceSteps={steps}
          maxPrice={maxPrice}
          onMaxPrice={setMaxPrice}
          currency={currency}
          onClearAll={clearAllFilters}
          onChange={updateFilters}
          onClose={() => setPanel(null)}
        />
      )}
      {openDish && (
        <DishSheet
          key={openDish.id}
          dish={openDish}
          text={textFor(openDish)}
          avoid={avoid}
          language={language}
          restaurantSlug={restaurant.slug}
          onExplained={(insight) => rememberSummary(openDish, insight.summary)}
          onClose={() => setOpenDishId(null)}
        />
      )}
      {choosingDish && (
        <DishChoiceSheet
          key={choosingDish.id}
          dish={choosingDish}
          text={textFor(choosingDish)}
          t={t}
          closeLabel={tableText.close}
          avoid={avoid}
          currency={currency}
          onAdd={(choice) => {
            const key = lineKey(choosingDish.id, choice);
            setQuantity(key, (order[key] ?? 0) + 1);
            setChoosingId(null);
          }}
          onClose={() => setChoosingId(null)}
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
          severity={prefs.severity}
          onQuantity={setQuantity}
          onClear={table.clear}
          tableCode={table.code}
          tableEnded={table.ended}
          onStartTogether={table.startShared}
          onLeaveTogether={table.leaveShared}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "allergy-card" && (
        <AllergyCard
          staffLanguage={staffLanguage}
          language={language}
          avoid={avoid}
          severity={prefs.severity}
          onSeverity={(severity) => setPrefs({ ...prefs, severity })}
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
