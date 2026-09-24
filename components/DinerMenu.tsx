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
import { ALLERGENS, DIETARY_TAGS, type Allergen, type DietaryTag } from "@/lib/allergens";
import { fetchTranslations, trackDishView } from "@/lib/api-client";
import { writePrefsCookie, type DinerPrefs } from "@/lib/diner-prefs";
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

const COVER_FALLBACK =
  "radial-gradient(circle at 20% 30%, #3a4d63, transparent 50%), radial-gradient(circle at 85% 80%, #7a5000, transparent 45%), #111b26";

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
    <header className="relative isolate flex min-h-[38svh] items-end overflow-hidden bg-ink text-white">
      {cover ? (
        <Image
          src={cover}
          alt=""
          fill
          priority
          sizes="100vw"
          className="ken-burns -z-20 object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20"
          style={{ background: COVER_FALLBACK }}
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/45 to-ink/10"
      />
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-end justify-between gap-4 px-5 pt-24 pb-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-serif text-5xl leading-tight sm:text-6xl"
          >
            {name}
          </motion.h1>
          {cuisine && <p className="mt-2 text-white/75">{cuisine}</p>}
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
  const [avoid, setAvoid] = useState<Allergen[]>(initialPrefs.avoid);
  const [onlyTags, setOnlyTags] = useState<DietaryTag[]>(initialPrefs.onlyTags);
  const [order, setOrder] = useState<Record<string, number>>({});
  const [openDishId, setOpenDishId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [display, setDisplay] = useState<DisplayPrefs>(initialDisplay);
  const requested = useRef(new Set<LanguageCode>());

  // Fetch each language's translations once, the first time a diner picks it.
  useEffect(() => {
    if (language === ORIGINAL_LANGUAGE || requested.current.has(language)) return;
    requested.current.add(language);
    fetchTranslations(restaurant.slug, language)
      .then((result) => setByLanguage((prev) => ({ ...prev, [language]: result })))
      .catch(() => setByLanguage((prev) => ({ ...prev, [language]: "failed" })));
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
    <label className="flex items-center gap-2 text-sm">
      <span className="text-white/70">{t.language}</span>
      <select
        value={language}
        onChange={(e) => chooseLanguage(e.target.value)}
        className="rounded-md border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur focus:border-white [&>option]:text-ink"
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
        <main className="mx-auto max-w-3xl px-5 py-12">
          <p className="text-muted">{t.notReady}</p>
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

      <main className="mx-auto max-w-3xl px-5 pb-36">
        <p
          role="note"
          className="mt-6 rounded-xl border border-saffron/40 bg-saffron-soft px-4 py-3 text-sm leading-relaxed text-saffron-ink"
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

        <section
          aria-label={t.hideContaining}
          className="mt-8 rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-6"
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

          <AnimatePresence initial={false}>
            {filtering && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4 text-sm">
                  <p aria-live="polite" className="text-muted">
                    {t.showing(shown.length, dishes.length, hiddenCount)}
                  </p>
                  <button
                    onClick={() => updateFilters([], [])}
                    className="text-muted underline hover:text-ink"
                  >
                    {t.clearFilters}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {shown.length === 0 ? (
          <p className="mt-10 text-muted">{t.noMatch}</p>
        ) : (
          <ul className="mt-6 space-y-4">
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
                    className="rounded-2xl border border-line bg-card p-5 transition-shadow duration-300 hover:shadow-md sm:p-6"
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
                              <span className="text-muted">{t.contains}</span>
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
                          className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28"
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
                    <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4">
                      <button
                        onClick={() => openDetails(dish.id)}
                        className="text-sm font-medium underline underline-offset-4 hover:text-muted"
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
        language={language}
        restaurantSlug={restaurant.slug}
        open={panel === "chat"}
        onClose={() => setPanel(null)}
      />
    </div>
  );
}
