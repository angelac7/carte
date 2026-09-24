"use client";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AllergyCard } from "@/components/AllergyCard";
import { Chip } from "@/components/Chip";
import { DishActions } from "@/components/DishActions";
import { DishHeader } from "@/components/DishHeader";
import { DishSheet } from "@/components/DishSheet";
import { DisplaySettings } from "@/components/DisplaySettings";
import { BagIcon, CameraIcon, ChatIcon, ShieldIcon } from "@/components/icons";
import { MenuChat } from "@/components/MenuChat";
import { MenuDock } from "@/components/MenuDock";
import { MenuExtras } from "@/components/MenuExtras";
import { OrderHelper } from "@/components/OrderHelper";
import { OrderSheet } from "@/components/OrderSheet";
import { PhotoLookup } from "@/components/PhotoLookup";
import { QuantityStepper } from "@/components/QuantityStepper";
import { ToggleChip } from "@/components/ToggleChip";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { panelClass } from "@/components/ui/panel";
import { ALLERGENS, DIETARY_TAGS, type Allergen, type DietaryTag } from "@/lib/allergens";
import { fetchTranslations, trackDishView } from "@/lib/api-client";
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
type Panel = "order" | "allergy-card" | "helper" | "display" | "chat" | "photo" | null;

type DinerMenuProps = {
  restaurant: { name: string; slug: string; cuisine: string };
  dishes: MenuItem[];
  initialLanguage: LanguageCode;
  initialPrefs: DinerPrefs;
  initialDisplay: DisplayPrefs;
};

/** The restaurant's name over a slowly zooming photo of one of its dishes. */
function MenuHero({
  name,
  cuisine,
  cover,
  picker,
}: {
  name: string;
  cuisine: string;
  cover: string | null;
  picker: ReactNode;
}) {
  return (
    <header className="texture-ink relative isolate flex min-h-[40svh] items-end overflow-hidden text-white">
      {cover && (
        <>
          <Image
            src={cover}
            alt=""
            fill
            priority
            sizes="100vw"
            className="ken-burns -z-20 object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/45 to-ink/10"
          />
        </>
      )}
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-end justify-between gap-6 px-5 pt-24 pb-10">
        <div className="min-w-0">
          {cuisine && <p className="eyebrow text-white/60">{cuisine}</p>}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-3 font-serif text-5xl leading-[0.95] tracking-tighter text-balance break-words sm:text-7xl"
          >
            {name}
          </motion.h1>
        </div>
        {picker}
      </div>
    </header>
  );
}

/** The public menu diners see. Receives confirmed dishes only. */
export function DinerMenu({
  restaurant,
  dishes,
  initialLanguage,
  initialPrefs,
  initialDisplay,
}: DinerMenuProps) {
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);
  const [byLanguage, setByLanguage] = useState<TranslationState>({});
  const [prefs, setPrefs] = useDinerPrefs(initialPrefs);
  const { avoid, onlyTags } = prefs;
  const [order, setOrder] = useState<Record<string, number>>({});
  const [openDishId, setOpenDishId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [display, setDisplay] = useState<DisplayPrefs>(initialDisplay);
  const requested = useRef(new Set<LanguageCode>());
  const [translationAttempt, setTranslationAttempt] = useState(0);

  // Fetch each language's translations once, the first time a diner picks it.
  useEffect(() => {
    if (language === ORIGINAL_LANGUAGE || requested.current.has(language)) return;
    requested.current.add(language);
    fetchTranslations(restaurant.slug, language)
      .then((result) => setByLanguage((prev) => ({ ...prev, [language]: result })))
      .catch(() => setByLanguage((prev) => ({ ...prev, [language]: "failed" })));
  }, [language, restaurant.slug, translationAttempt]);

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
  const openDish = dishes.find((dish) => dish.id === openDishId);
  const orderCount = Object.values(order).reduce((sum, quantity) => sum + quantity, 0);
  const cover = dishes.find((dish) => dish.photo_url)?.photo_url ?? null;

  const languagePicker = (
    <label className="flex items-center gap-3">
      <span className="eyebrow text-white/60">{t.language}</span>
      <select
        value={language}
        onChange={(e) => chooseLanguage(e.target.value)}
        className="rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm text-white backdrop-blur focus:border-white [&>option]:text-ink"
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
      <div lang={htmlLang(language)}>
        <MenuHero
          name={restaurant.name}
          cuisine={restaurant.cuisine}
          cover={null}
          picker={languagePicker}
        />
        <main id="main" className="mx-auto max-w-3xl px-5 py-12">
          <EmptyState>{t.notReady}</EmptyState>
        </main>
      </div>
    );
  }

  return (
    <div lang={htmlLang(language)}>
      <MenuHero
        name={restaurant.name}
        cuisine={restaurant.cuisine}
        cover={cover}
        picker={languagePicker}
      />

      <main id="main" className="mx-auto max-w-3xl px-5 pb-36">
        <Notice className="mt-6">{t.safetyNotice}</Notice>
        {translating && (
          <p role="status" className="mt-3 text-sm text-muted">
            {t.translating}
          </p>
        )}
        {status === "failed" && (
          <p role="alert" className="mt-3 text-sm text-tomato">
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
        {translations && <p className="mt-3 text-sm text-muted">{t.translatedNote}</p>}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => setPanel("helper")} shine>
            {helpText.helperButton}
          </Button>
          <Button onClick={() => setPanel("display")} variant="secondary">
            {helpText.display}
          </Button>
        </div>

        <MenuExtras
          restaurant={restaurant}
          language={language}
          menuSize={dishes.length}
          candidates={shown}
          textFor={textFor}
          onOpenDish={openDetails}
        />

        <section aria-label={t.hideContaining} className={panelClass("mt-8 p-6 sm:p-8")}>
          <fieldset>
            <legend className="eyebrow text-muted">{t.hideContaining}</legend>
            <div className="mt-4 flex flex-wrap gap-2.5">
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

          <fieldset className="mt-6">
            <legend className="eyebrow text-muted">{t.showOnly}</legend>
            <div className="mt-4 flex flex-wrap gap-2.5">
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

          <AnimatePresence initial={false}>
            {filtering && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5 text-sm">
                  <p aria-live="polite" className="text-muted">
                    {t.showing(shown.length, dishes.length, hiddenCount)}
                  </p>
                  <button
                    onClick={() => updateFilters([], [])}
                    className="text-muted underline underline-offset-4 hover:text-ink"
                  >
                    {t.clearFilters}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {shown.length === 0 ? (
          <EmptyState className="mt-6">{t.noMatch}</EmptyState>
        ) : (
          <ul className="mt-8 space-y-6">
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((dish) => {
                const text = textFor(dish);
                return (
                  <motion.li
                    key={dish.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="rounded-panel bg-paper p-6 shadow-raised transition-shadow duration-300 hover:shadow-raised-lg sm:p-7"
                  >
                    <div className="flex gap-4">
                      <div className="min-w-0 flex-1">
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
                              <span className="eyebrow text-muted">{t.contains}</span>
                              {dish.allergens.map((allergen) => (
                                <Chip
                                  key={allergen}
                                  label={t.allergens[allergen]}
                                  tone="allergen"
                                />
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
                        <DishActions dish={dish} restaurant={restaurant} language={language} />
                      </div>
                      {dish.photo_url && (
                        <button
                          type="button"
                          onClick={() => openDetails(dish.id)}
                          aria-label={`${dishText.details}: ${text.name}`}
                          className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.25rem] shadow-raised-sm sm:h-28 sm:w-28"
                        >
                          <Image
                            src={dish.photo_url}
                            alt=""
                            fill
                            sizes="112px"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </button>
                      )}
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4 border-t border-ink/10 pt-5">
                      <button
                        onClick={() => openDetails(dish.id)}
                        className="text-sm font-semibold underline underline-offset-4 hover:text-accent"
                      >
                        {dishText.details}
                      </button>
                      <QuantityStepper
                        quantity={order[dish.id] ?? 0}
                        onChange={(quantity) => setQuantity(dish.id, quantity)}
                        labels={tableText}
                      />
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
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
      {panel === "helper" && (
        <OrderHelper
          restaurantSlug={restaurant.slug}
          language={language}
          dishes={dishes}
          avoid={avoid}
          onlyTags={onlyTags}
          order={order}
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
