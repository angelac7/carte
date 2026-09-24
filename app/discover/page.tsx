import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { Badge, CardImage, cardClass } from "@/components/cards";
import { Chip } from "@/components/Chip";
import { BlurFade } from "@/components/motion/BlurFade";
import { PageHero } from "@/components/PageHero";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { cravingToTerms } from "@/lib/ai/craving";
import { ALLERGENS, DIETARY_TAGS, isAllergen, isDietaryTag } from "@/lib/allergens";
import { cn } from "@/lib/cn";
import {
  listCities,
  searchDishes,
  searchRestaurants,
  trendingDishes,
  type DishResult,
  type RestaurantResult,
  type TrendingDish,
} from "@/lib/db/discover";
import { parsePrefs, PREFS_COOKIE } from "@/lib/diner-prefs";
import { DINER_STRINGS, type DinerStrings } from "@/lib/i18n/diner-strings";
import { DISCOVER_STRINGS, type DiscoverStrings } from "@/lib/i18n/discover-strings";
import { PLACES_STRINGS } from "@/lib/i18n/places-strings";
import {
  htmlLang,
  isLanguageCode,
  LANGUAGE_COOKIE,
  languageFromAcceptHeader,
} from "@/lib/languages";
import { filterDishes } from "@/lib/menu-filters";
import { publicAsset } from "@/lib/public-asset";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";
import {
  directionsUrl,
  isOccasion,
  isOpenNow,
  OCCASIONS,
  type Occasion,
  type WeeklyHours,
} from "@/lib/restaurant-profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Discover | Carte" };

type Params = Record<string, string | string[] | undefined>;
type DiscoverProps = { searchParams: Promise<Params> };
type Place = { city: string; occasions: Occasion[]; hours: WeeklyHours; timezone: string };

const many = (value: Params[string]) => (Array.isArray(value) ? value : value ? [value] : []);
const one = (value: Params[string]) => (Array.isArray(value) ? value[0] : value) ?? "";

// Matches ToggleChip, as a checkbox label so the filters work without JavaScript.
const chipClass =
  "cursor-pointer rounded-full border border-line bg-card px-3.5 py-1.5 text-sm text-muted transition-colors hover:border-muted hover:text-ink has-checked:border-ink has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink";
const selectClass = fieldClass();
const stagger = (index: number) => Math.min(index, 8) * 0.05;

function DishGrid({
  dishes,
  d,
  t,
}: {
  dishes: (DishResult | TrendingDish)[];
  d: DinerStrings;
  t: DiscoverStrings;
}) {
  return (
    <ul className="mt-6 grid gap-5 sm:grid-cols-2">
      {dishes.map((dish, index) => (
        <li key={dish.dish_id}>
          <BlurFade delay={stagger(index)} className="h-full">
            <Link
              href={`/r/${dish.restaurant_slug}`}
              className={cn(cardClass, "flex h-full flex-col")}
            >
              <CardImage
                src={dish.photo_url}
                alt={dish.dish_name}
                index={index}
                monogram={dish.dish_name.charAt(0)}
              >
                {dish.price && (
                  <Badge className="right-3 left-auto tabular-nums">{dish.price}</Badge>
                )}
              </CardImage>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-serif text-xl leading-snug">{dish.dish_name}</h3>
                <p className="mt-1 text-sm text-muted">
                  {dish.restaurant_name}
                  {dish.city && `, ${dish.city}`}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {dish.allergens.length > 0 ? (
                    <>
                      <span className="text-muted">{d.contains}</span>
                      {dish.allergens.map((allergen) => (
                        <Chip key={allergen} label={d.allergens[allergen]} tone="allergen" />
                      ))}
                    </>
                  ) : (
                    <span className="text-muted">{d.noMajorAllergens}</span>
                  )}
                  {dish.dietary_tags.map((tag) => (
                    <Chip key={tag} label={d.tags[tag]} tone="tag" />
                  ))}
                </div>
                <p className="mt-auto pt-4 text-sm font-medium underline underline-offset-4">
                  {t.viewMenu}
                </p>
              </div>
            </Link>
          </BlurFade>
        </li>
      ))}
    </ul>
  );
}

function RestaurantGrid({
  restaurants,
  t,
}: {
  restaurants: RestaurantResult[];
  t: DiscoverStrings;
}) {
  return (
    <ul className="mt-6 grid gap-5 sm:grid-cols-2">
      {restaurants.map((restaurant, index) => {
        const open = isOpenNow(restaurant.hours, restaurant.timezone);
        return (
          <li key={restaurant.id}>
            <BlurFade delay={stagger(index)} className="h-full">
              <article className={cn(cardClass, "flex h-full flex-col")}>
                <Link
                  href={`/r/${restaurant.slug}`}
                  className="block"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <CardImage
                    src={restaurant.cover_url}
                    alt=""
                    index={index}
                    monogram={restaurant.name.charAt(0)}
                  >
                    <Badge tone={open ? "basil" : "dark"}>
                      {open === null ? t.hoursUnknown : open ? t.openStatus : t.closedStatus}
                    </Badge>
                  </CardImage>
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-serif text-2xl leading-snug">
                    <Link href={`/r/${restaurant.slug}`} className="hover:underline">
                      {restaurant.name}
                    </Link>
                  </h3>
                  {(restaurant.cuisine || restaurant.city) && (
                    <p className="mt-1 text-sm text-muted">
                      {[restaurant.cuisine, restaurant.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {restaurant.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed">
                      {restaurant.description}
                    </p>
                  )}
                  {restaurant.occasions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {restaurant.occasions.map((occasion) => (
                        <Chip key={occasion} label={t.occasions[occasion]} tone="tag" />
                      ))}
                    </div>
                  )}
                  <div className="mt-auto flex gap-4 pt-4 text-sm">
                    <Link
                      href={`/r/${restaurant.slug}`}
                      className="font-medium underline underline-offset-4 hover:text-muted"
                    >
                      {t.viewMenu}
                    </Link>
                    {restaurant.address && (
                      <a
                        href={directionsUrl(restaurant.name, restaurant.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted underline underline-offset-4 hover:text-ink"
                      >
                        {t.directions}
                      </a>
                    )}
                  </div>
                </div>
              </article>
            </BlurFade>
          </li>
        );
      })}
    </ul>
  );
}

export default async function DiscoverPage({ searchParams }: DiscoverProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const headerStore = await headers();

  const savedLanguage = cookieStore.get(LANGUAGE_COOKIE)?.value;
  const language =
    savedLanguage && isLanguageCode(savedLanguage)
      ? savedLanguage
      : languageFromAcceptHeader(headerStore.get("accept-language") ?? "");
  const t = DISCOVER_STRINGS[language];
  const d = DINER_STRINGS[language];

  // Use the diner's saved filters until they change them on this page.
  const submitted = one(params.filters) === "1";
  const saved = parsePrefs(cookieStore.get(PREFS_COOKIE)?.value);
  const avoid = submitted ? many(params.avoid).filter(isAllergen) : saved.avoid;
  const onlyTags = submitted ? many(params.tag).filter(isDietaryTag) : saved.onlyTags;

  const query = one(params.q).trim().slice(0, 100);
  const tab = one(params.type) === "restaurants" ? "restaurants" : "dishes";
  const occasionParam = one(params.occasion);
  const occasion = isOccasion(occasionParam) ? occasionParam : "";
  const openOnly = one(params.open) === "1";
  const city = one(params.city).slice(0, 80);
  const activeFilters =
    avoid.length + onlyTags.length + (openOnly ? 1 : 0) + (occasion ? 1 : 0) + (city ? 1 : 0);

  const supabase = await createClient();
  const cities = await listCities(supabase);

  const matchesPlace = (place: Place) =>
    (!city || place.city === city) &&
    (!occasion || place.occasions.includes(occasion)) &&
    (!openOnly || isOpenNow(place.hours, place.timezone) === true);

  let dishes: DishResult[] = [];
  let restaurants: RestaurantResult[] = [];
  let trending: TrendingDish[] = [];
  let cravingUsed = false;

  if (tab === "restaurants") {
    restaurants = (await searchRestaurants(supabase, query)).filter(matchesPlace);
  } else if (query) {
    dishes = await searchDishes(supabase, query);
    // No direct matches for a phrase: let AI turn the craving into dish words, then search again.
    const isPhrase = query.split(/\s+/).length >= 2;
    const allowed = checkRateLimit(
      `craving:${clientKeyFromHeaders(headerStore)}`,
      20,
      10 * 60 * 1000,
    );
    if (dishes.length === 0 && isPhrase && allowed) {
      const terms = await cravingToTerms(query).catch(() => [] as string[]);
      if (terms.length > 0) {
        dishes = await searchDishes(supabase, terms.join(" or "));
        cravingUsed = dishes.length > 0;
      }
    }
    dishes = filterDishes(dishes, { avoid, onlyTags }).filter(matchesPlace);
  } else {
    trending = filterDishes(await trendingDishes(supabase), { avoid, onlyTags });
  }

  return (
    <>
      <PublicHeader />
      <PageHero
        title={t.title}
        intro={t.intro}
        image={publicAsset("images/discover.jpg")}
        lang={htmlLang(language)}
      >
        <Link
          href="/places"
          className="text-sm text-white/80 underline underline-offset-4 hover:text-white"
        >
          {PLACES_STRINGS[language].placesLink}
        </Link>
      </PageHero>

      <main
        id="main"
        lang={htmlLang(language)}
        className="relative z-10 mx-auto -mt-10 max-w-5xl px-5 pb-20"
      >
        <form
          action="/discover"
          method="get"
          className="rounded-2xl border border-line bg-card p-5 shadow-xl sm:p-6"
        >
          <input type="hidden" name="filters" value="1" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              name="q"
              defaultValue={query}
              maxLength={100}
              aria-label={t.searchLabel}
              placeholder={t.placeholder}
              className={fieldClass("flex-1 bg-paper px-4 py-3 text-base sm:text-lg")}
            />
            <button type="submit" className={buttonClass({ size: "lg", shine: true })}>
              {t.search}
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            {(["dishes", "restaurants"] as const).map((option) => (
              <label key={option} className={chipClass}>
                <input
                  type="radio"
                  name="type"
                  value={option}
                  defaultChecked={tab === option}
                  className="sr-only"
                />
                {option === "dishes" ? t.dishesTab : t.restaurantsTab}
              </label>
            ))}
          </div>

          <details
            open={activeFilters > 0}
            className="group mt-5 rounded-xl border border-line bg-paper/60"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                {t.filters}
                {activeFilters > 0 && (
                  <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-white tabular-nums">
                    {activeFilters}
                  </span>
                )}
              </span>
              <span
                aria-hidden="true"
                className="text-lg leading-none text-muted transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="space-y-5 border-t border-line px-4 py-4">
              <fieldset>
                <legend className="text-sm font-medium">{d.hideContaining}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ALLERGENS.map((allergen) => (
                    <label key={allergen} className={chipClass}>
                      <input
                        type="checkbox"
                        name="avoid"
                        value={allergen}
                        defaultChecked={avoid.includes(allergen)}
                        className="sr-only"
                      />
                      {d.allergens[allergen]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium">{d.showOnly}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DIETARY_TAGS.map((tag) => (
                    <label key={tag} className={chipClass}>
                      <input
                        type="checkbox"
                        name="tag"
                        value={tag}
                        defaultChecked={onlyTags.includes(tag)}
                        className="sr-only"
                      />
                      {d.tags[tag]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid items-center gap-4 sm:grid-cols-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="open"
                    value="1"
                    defaultChecked={openOnly}
                    className="h-4 w-4 accent-ink"
                  />
                  {t.openNow}
                </label>
                <label className="text-sm">
                  <span className="sr-only">{t.occasion}</span>
                  <select name="occasion" defaultValue={occasion} className={selectClass}>
                    <option value="">{t.anyOccasion}</option>
                    {OCCASIONS.map((option) => (
                      <option key={option} value={option}>
                        {t.occasions[option]}
                      </option>
                    ))}
                  </select>
                </label>
                {cities.length > 0 && (
                  <label className="text-sm">
                    <span className="sr-only">{t.city}</span>
                    <select name="city" defaultValue={city} className={selectClass}>
                      <option value="">{t.anyCity}</option>
                      {cities.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>
          </details>
        </form>

        <Notice className="mt-6">{d.safetyNotice}</Notice>

        {tab === "dishes" && !query && trending.length > 0 && (
          <section className="mt-12">
            <BlurFade>
              <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">{t.trending}</h2>
            </BlurFade>
            <DishGrid dishes={trending} d={d} t={t} />
          </section>
        )}

        {tab === "dishes" && query && (
          <section className="mt-12">
            {cravingUsed && <p className="mb-2 text-sm text-muted">{t.cravingNote(query)}</p>}
            {dishes.length === 0 ? (
              <EmptyState>{t.noResults}</EmptyState>
            ) : (
              <DishGrid dishes={dishes} d={d} t={t} />
            )}
          </section>
        )}

        {tab === "restaurants" && (
          <section className="mt-12">
            {restaurants.length === 0 ? (
              <EmptyState>{t.noResults}</EmptyState>
            ) : (
              <RestaurantGrid restaurants={restaurants} t={t} />
            )}
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
