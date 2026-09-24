"use client";
import Link from "next/link";
import { useState } from "react";
import { AllergyCard } from "@/components/AllergyCard";
import { DiaryEditor } from "@/components/DiaryEditor";
import type { Allergen } from "@/lib/allergens";
import { requestTasteProfile } from "@/lib/api-client";
import { writePrefsCookie, type DinerPrefs } from "@/lib/diner-prefs";
import { MY_CARTE_STRINGS } from "@/lib/i18n/my-carte-strings";
import { htmlLang, type LanguageCode } from "@/lib/languages";
import {
  computeChallenges,
  EMPTY_MY_CARTE,
  removeSavedDish,
  removeSavedRestaurant,
  type DiaryEntry,
} from "@/lib/my-carte";
import { updateMyCarte, useMyCarte } from "@/lib/my-carte-store";
import { toggleValue } from "@/lib/toggle-value";
import type { TasteProfile } from "@/types/taste";

type Tab = "saved" | "diary" | "taste" | "challenges" | "card";
type TasteStatus = "idle" | "loading" | "done" | "failed";

type MyCarteProps = { language: LanguageCode; initialPrefs: DinerPrefs };

const linkClass = "underline underline-offset-4 hover:text-muted";

export function MyCarte({ language, initialPrefs }: MyCarteProps) {
  const t = MY_CARTE_STRINGS[language];
  const state = useMyCarte();
  const [tab, setTab] = useState<Tab>("saved");
  const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const [tasteStatus, setTasteStatus] = useState<TasteStatus>("idle");
  const [taste, setTaste] = useState<TasteProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [avoid, setAvoid] = useState<Allergen[]>(initialPrefs.avoid);

  const tabs: [Tab, string][] = [
    ["saved", t.tabSaved],
    ["diary", t.tabDiary],
    ["taste", t.tabTaste],
    ["challenges", t.tabChallenges],
    ["card", t.tabCard],
  ];

  async function createTaste() {
    setTasteStatus("loading");
    try {
      const profile = await requestTasteProfile({
        language,
        dishes: state.diary.slice(0, 40).map((entry) => ({
          name: entry.name.slice(0, 120),
          rating: entry.rating,
          note: entry.note.slice(0, 200),
          cuisine: entry.cuisine.slice(0, 60),
          restaurant: entry.restaurantName.slice(0, 120),
        })),
        saved: state.dishes.slice(0, 40).map((dish) => dish.name.slice(0, 120)),
      });
      setTaste(profile);
      setTasteStatus("done");
    } catch {
      setTasteStatus("failed");
    }
  }

  async function shareTaste(profile: TasteProfile) {
    const text = [
      profile.summary,
      profile.loves.length ? `${t.loves}: ${profile.loves.join(", ")}` : "",
      profile.tryNext.length ? `${t.tryNext}: ${profile.tryNext.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    if (navigator.share) {
      await navigator.share({ title: t.tabTaste, text }).catch(() => {});
      return;
    }
    await navigator.clipboard?.writeText(text);
    setCopied(true);
  }

  function toggleAllergy(allergen: Allergen) {
    const next = toggleValue(avoid, allergen);
    setAvoid(next);
    writePrefsCookie({ avoid: next, onlyTags: initialPrefs.onlyTags });
  }

  function clearAll() {
    if (window.confirm(t.clearConfirm)) updateMyCarte(() => EMPTY_MY_CARTE);
  }

  const challenges = computeChallenges(state, new Date());

  return (
    <main lang={htmlLang(language)} className="mx-auto max-w-3xl px-5 pt-4 pb-20">
      <div className="mt-8 flex flex-wrap gap-2" role="tablist">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              tab === key ? "bg-ink text-white" : "text-muted hover:bg-card hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="mt-6" role="tabpanel">
        {tab === "saved" &&
          (state.dishes.length === 0 && state.restaurants.length === 0 ? (
            <p className="text-muted">{t.emptySaved}</p>
          ) : (
            <div className="space-y-8">
              {state.restaurants.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl">{t.savedRestaurants}</h2>
                  <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-card px-5">
                    {state.restaurants.map((restaurant) => (
                      <li
                        key={restaurant.slug}
                        className="flex items-center justify-between gap-4 py-4"
                      >
                        <div>
                          <p className="font-medium">{restaurant.name}</p>
                          {restaurant.cuisine && (
                            <p className="text-sm text-muted">{restaurant.cuisine}</p>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm">
                          <Link href={`/r/${restaurant.slug}`} className={linkClass}>
                            {t.viewMenu}
                          </Link>
                          <button
                            onClick={() =>
                              updateMyCarte((s) => removeSavedRestaurant(s, restaurant.slug))
                            }
                            className="text-muted hover:text-tomato"
                          >
                            {t.remove}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {state.dishes.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl">{t.savedDishes}</h2>
                  <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-card px-5">
                    {state.dishes.map((dish) => (
                      <li
                        key={dish.dishId}
                        className="flex items-center justify-between gap-4 py-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{dish.name}</p>
                          <p className="text-sm text-muted">
                            {dish.restaurantName}
                            {dish.price && <span className="tabular-nums">, {dish.price}</span>}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-4 text-sm">
                          <Link href={`/r/${dish.restaurantSlug}`} className={linkClass}>
                            {t.viewMenu}
                          </Link>
                          <button
                            onClick={() => updateMyCarte((s) => removeSavedDish(s, dish.dishId))}
                            className="text-muted hover:text-tomato"
                          >
                            {t.remove}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

        {tab === "diary" &&
          (state.diary.length === 0 ? (
            <p className="text-muted">{t.emptyDiary}</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line bg-card px-5">
              {state.diary.map((entry) => (
                <li key={entry.dishId} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">{entry.name}</p>
                      <p className="text-sm text-muted">{entry.restaurantName}</p>
                    </div>
                    <span className="shrink-0 text-saffron" aria-label={t.stars(entry.rating)}>
                      {"★".repeat(entry.rating)}
                      <span className="text-line">{"★".repeat(5 - entry.rating)}</span>
                    </span>
                  </div>
                  {entry.note && <p className="mt-2 text-sm leading-relaxed">{entry.note}</p>}
                  <button onClick={() => setEditing(entry)} className={`mt-2 text-sm ${linkClass}`}>
                    {t.rateTitle}
                  </button>
                </li>
              ))}
            </ul>
          ))}

        {tab === "taste" && (
          <div>
            <p className="max-w-xl leading-relaxed text-muted">{t.tasteIntro}</p>
            {state.diary.length < 3 ? (
              <p className="mt-4 text-sm text-muted">{t.tasteNeedMore}</p>
            ) : (
              <button
                onClick={createTaste}
                disabled={tasteStatus === "loading"}
                className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-60"
              >
                {tasteStatus === "loading" ? t.tasteLoading : t.tasteButton}
              </button>
            )}
            {tasteStatus === "failed" && (
              <p role="alert" className="mt-4 text-sm text-tomato">
                {t.tasteFailed}
              </p>
            )}
            {taste && tasteStatus === "done" && (
              <div className="mt-6 rounded-lg border border-line bg-card p-5">
                <p className="leading-relaxed">{taste.summary}</p>
                {taste.loves.length > 0 && (
                  <p className="mt-4 text-sm">
                    <span className="font-medium">{t.loves}:</span> {taste.loves.join(", ")}
                  </p>
                )}
                {taste.tryNext.length > 0 && (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">{t.tryNext}:</span> {taste.tryNext.join(", ")}
                  </p>
                )}
                <button
                  onClick={() => shareTaste(taste)}
                  className="mt-4 rounded-md border border-line px-4 py-2 text-sm hover:border-muted"
                >
                  {copied ? t.copied : t.share}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "challenges" && (
          <ul className="grid gap-4 sm:grid-cols-2">
            {challenges.map((challenge) => (
              <li
                key={challenge.id}
                className={`rounded-lg border bg-card p-4 ${challenge.done ? "border-basil" : "border-line"}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-serif text-lg">{t.challengeNames[challenge.id]}</h2>
                  {challenge.done ? (
                    <span className="text-sm font-medium text-basil">✓ {t.completed}</span>
                  ) : (
                    <span className="text-sm text-muted tabular-nums">
                      {challenge.progress}/{challenge.goal}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{t.challengeGoals[challenge.id]}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-basil"
                    style={{ width: `${(challenge.progress / challenge.goal) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === "card" && (
          <div>
            <p className="max-w-xl leading-relaxed text-muted">{t.cardIntro}</p>
            <button
              onClick={() => setCardOpen(true)}
              className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
            >
              {t.openCard}
            </button>
          </div>
        )}
      </section>

      <button onClick={clearAll} className="mt-12 text-sm text-muted hover:text-tomato">
        {t.clearAll}
      </button>

      {editing && (
        <DiaryEditor
          dish={editing}
          entry={editing}
          language={language}
          onClose={() => setEditing(null)}
        />
      )}
      {cardOpen && (
        <AllergyCard
          language={language}
          avoid={avoid}
          onToggle={toggleAllergy}
          onClose={() => setCardOpen(false)}
        />
      )}
    </main>
  );
}
