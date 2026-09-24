import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { Chip } from "@/components/Chip";
import { DishHeader } from "@/components/DishHeader";
import { PublicHeader } from "@/components/PublicHeader";
import { cravingToTerms } from "@/lib/ai/craving";
import { ALLERGENS, DIETARY_TAGS, isAllergen, isDietaryTag } from "@/lib/allergens";
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

const chipClass =
  "cursor-pointer rounded-full border border-line px-3 py-1 text-sm text-muted transition-colors hover:border-muted has-checked:border-ink has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-ink";
const selectClass =
  "w-full rounded-md border border-line bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none";

function DishList({
  dishes,
  d,
  t,
}: {
  dishes: (DishResult | TrendingDish)[];
  d: DinerStrings;
  t: DiscoverStrings;
}) {
  return (
    <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-card px-5 sm:px-6">
      {dishes.map((dish) => (
        <li key={dish.dish_id} className="py-5">
          <DishHeader name={dish.dish_name} price={dish.price} as="h3" />
          <p className="mt-0.5 text-sm text-muted">
            <Link href={`/r/${dish.restaurant_slug}`} className="hover:underline">
              {dish.restaurant_name}
            </Link>
            {dish.city && <span>, {dish.city}</span>}
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
          <Link
            href={`/r/${dish.restaurant_slug}`}
            className="mt-3 inline-block text-sm font-medium underline underline-offset-4 hover:text-muted"
          >
            {t.viewMenu}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function OpenStatus({ place, t }: { place: Place; t: DiscoverStrings }) {
  const open = isOpenNow(place.hours, place.timezone);
  if (open === null) return <span className="text-sm text-muted">{t.hoursUnknown}</span>;
  return open ? (
    <span className="text-sm font-medium text-basil">{t.openStatus}</span>
  ) : (
    <span className="text-sm text-muted">{t.closedStatus}</span>
  );
}

function RestaurantList({
  restaurants,
  t,
}: {
  restaurants: RestaurantResult[];
  t: DiscoverStrings;
}) {
  return (
    <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-card px-5 sm:px-6">
      {restaurants.map((restaurant) => (
        <li key={restaurant.id} className="py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-serif text-xl">
              <Link href={`/r/${restaurant.slug}`} className="hover:underline">
                {restaurant.name}
              </Link>
            </h3>
            <OpenStatus place={restaurant} t={t} />
          </div>
          {(restaurant.cuisine || restaurant.city) && (
            <p className="text-sm text-muted">
              {[restaurant.cuisine, restaurant.city].filter(Boolean).join(", ")}
            </p>
          )}
          {restaurant.description && (
            <p className="mt-1 max-w-prose text-sm leading-relaxed">{restaurant.description}</p>
          )}
          {restaurant.occasions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {restaurant.occasions.map((occasion) => (
                <Chip key={occasion} label={t.occasions[occasion]} tone="tag" />
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-4 text-sm">
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
        </li>
      ))}
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
      <main lang={htmlLang(language)} className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-serif text-4xl leading-tight">{t.title}</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-muted">{t.intro}</p>
        <Link
          href="/places"
          className="mt-2 inline-block text-sm underline underline-offset-4 hover:text-muted"
        >
          {PLACES_STRINGS[language].placesLink}
        </Link>

        <form
          action="/discover"
          method="get"
          className="mt-8 rounded-lg border border-line bg-card p-5 sm:p-6"
        >
          <input type="hidden" name="filters" value="1" />
          <label className="block">
            <span className="text-sm font-medium">{t.searchLabel}</span>
            <input
              name="q"
              defaultValue={query}
              maxLength={100}
              placeholder={t.placeholder}
              className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 focus:border-ink focus:outline-none"
            />
          </label>

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

          <fieldset className="mt-5">
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

          <fieldset className="mt-4">
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

          <div className="mt-5 grid items-center gap-4 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="open" value="1" defaultChecked={openOnly} />
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

          <button
            type="submit"
            className="mt-5 rounded-md bg-ink px-5 py-2 text-sm font-medium text-white hover:bg-ink/90"
          >
            {t.search}
          </button>
        </form>

        <p className="mt-6 text-sm leading-relaxed text-muted">{d.safetyNotice}</p>

        {tab === "dishes" && !query && trending.length > 0 && (
          <section className="mt-8">
            <h2 className="font-serif text-2xl">{t.trending}</h2>
            <DishList dishes={trending} d={d} t={t} />
          </section>
        )}

        {tab === "dishes" && query && (
          <section className="mt-8">
            {cravingUsed && <p className="text-sm text-muted">{t.cravingNote(query)}</p>}
            {dishes.length === 0 ? (
              <p className="text-muted">{t.noResults}</p>
            ) : (
              <DishList dishes={dishes} d={d} t={t} />
            )}
          </section>
        )}

        {tab === "restaurants" && (
          <section className="mt-8">
            {restaurants.length === 0 ? (
              <p className="text-muted">{t.noResults}</p>
            ) : (
              <RestaurantList restaurants={restaurants} t={t} />
            )}
          </section>
        )}
      </main>
    </>
  );
}
