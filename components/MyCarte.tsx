"use client";
import { motion } from "motion/react";
import Link from "@/components/OfflineLink";
import { useState } from "react";
import { AllergyCard } from "@/components/AllergyCard";
import { DiaryEditor } from "@/components/DiaryEditor";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import type { Allergen } from "@/lib/allergens";
import { requestTasteProfile } from "@/lib/api-client";
import { useDinerPrefs } from "@/lib/use-diner-prefs";
import { type DinerPrefs } from "@/lib/diner-prefs";
import { MY_CARTE_STRINGS } from "@/lib/i18n/my-carte-strings";
import { htmlLang, type LanguageCode } from "@/lib/languages";
import {
  computeChallenges,
  EMPTY_MY_CARTE,
  removeSavedDish,
  removeSavedRestaurant,
  type DiaryEntry,
} from "@/lib/my-carte";
import { useMyCarteWriter } from "@/lib/use-my-carte-writer";
import { useMyCarte } from "@/lib/my-carte-store";
import { toggleValue } from "@/lib/toggle-value";
import type { TasteProfile } from "@/types/taste";

type Tab = "saved" | "diary" | "taste" | "challenges" | "card";
type TasteStatus = "idle" | "loading" | "done" | "failed";

type MyCarteProps = { language: LanguageCode; initialPrefs: DinerPrefs };

const linkClass = "underline underline-offset-4 hover:text-muted";
const panelClass = "divide-y divide-ink/10 rounded-panel bg-paper px-6 shadow-raised";

export function MyCarte({ language, initialPrefs }: MyCarteProps) {
  const t = MY_CARTE_STRINGS[language];
  const saveOnDevice = useMyCarteWriter(language);
  const state = useMyCarte();
  const [tab, setTab] = useState<Tab>("saved");
  const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const [tasteStatus, setTasteStatus] = useState<TasteStatus>("idle");
  const [taste, setTaste] = useState<TasteProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [prefs, setPrefs] = useDinerPrefs(initialPrefs);
  const { avoid, onlyTags } = prefs;

  const tabs: [Tab, string][] = [
    ["saved", t.tabSaved],
    ["diary", t.tabDiary],
    ["taste", t.tabTaste],
    ["challenges", t.tabChallenges],
    ["card", t.tabCard],
  ];

  async function createTaste() {
    setTasteStatus("loading");
    setCopied(false);
    setShareFailed(false);
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
    setShareFailed(false);
    try {
      if (navigator.share) {
        await navigator.share({ title: t.tabTaste, text });
        return;
      }
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setShareFailed(true);
    }
  }

  function toggleAllergy(allergen: Allergen) {
    const next = toggleValue(avoid, allergen);
    setPrefs({ avoid: next, onlyTags });
  }

  function clearAll() {
    if (window.confirm(t.clearConfirm) && saveOnDevice(() => EMPTY_MY_CARTE)) {
      setTaste(null);
      setTasteStatus("idle");
      setCopied(false);
      setShareFailed(false);
      setEditing(null);
    }
  }

  const challenges = computeChallenges(state, new Date());

  return (
    <main id="main" lang={htmlLang(language)} className="mx-auto max-w-3xl px-5 pt-4 pb-20">
      {/* Scrolls sideways on narrow phones instead of wrapping onto two rows. */}
      <div className="-mx-5 mt-8 overflow-x-auto px-5 pb-1">
        <div
          role="tablist"
          className="flex w-max gap-1 rounded-full bg-paper p-1.5 shadow-raised-sm"
        >
          {tabs.map(([key, label]) => (
            <button
              key={key}
              id={`my-tab-${key}`}
              role="tab"
              aria-selected={tab === key}
              aria-controls="my-tab-panel"
              onClick={() => setTab(key)}
              className={`relative isolate rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === key ? "text-white" : "text-muted hover:text-ink"
              }`}
            >
              {tab === key && (
                <motion.span
                  layoutId="my-carte-tab"
                  className="absolute inset-0 -z-10 rounded-full bg-ink shadow-pressed-color"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      <section id="my-tab-panel" className="mt-6" role="tabpanel" aria-labelledby={`my-tab-${tab}`}>
        {tab === "saved" &&
          (state.dishes.length === 0 && state.restaurants.length === 0 ? (
            <EmptyState>{t.emptySaved}</EmptyState>
          ) : (
            <div className="space-y-8">
              {state.restaurants.length > 0 && (
                <div>
                  <h2 className="font-serif text-3xl tracking-tight">{t.savedRestaurants}</h2>
                  <ul className={`mt-3 ${panelClass}`}>
                    {state.restaurants.map((restaurant) => (
                      <li
                        key={restaurant.slug}
                        className="flex items-center justify-between gap-4 py-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{restaurant.name}</p>
                          {restaurant.cuisine && (
                            <p className="text-sm text-muted">{restaurant.cuisine}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-4 text-sm">
                          <Link href={`/r/${restaurant.slug}`} className={linkClass}>
                            {t.viewMenu}
                          </Link>
                          <button
                            onClick={() =>
                              saveOnDevice((s) => removeSavedRestaurant(s, restaurant.slug))
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
                  <h2 className="font-serif text-3xl tracking-tight">{t.savedDishes}</h2>
                  <ul className={`mt-3 ${panelClass}`}>
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
                            onClick={() => saveOnDevice((s) => removeSavedDish(s, dish.dishId))}
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
            <EmptyState>{t.emptyDiary}</EmptyState>
          ) : (
            <ul className={panelClass}>
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
              <EmptyState className="mt-4">{t.tasteNeedMore}</EmptyState>
            ) : (
              <Button
                onClick={createTaste}
                disabled={tasteStatus === "loading"}
                shine
                className="mt-4"
              >
                {tasteStatus === "loading" ? t.tasteLoading : t.tasteButton}
              </Button>
            )}
            {tasteStatus === "failed" && (
              <Notice tone="warning" role="alert" className="mt-4">
                {t.tasteFailed}
              </Notice>
            )}
            {taste && tasteStatus === "done" && (
              <div className="mt-6 rounded-panel bg-paper p-6 shadow-raised sm:p-8">
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
                <Button onClick={() => shareTaste(taste)} variant="secondary" className="mt-4">
                  {copied ? t.copied : t.share}
                </Button>
                {shareFailed && (
                  <Notice tone="warning" role="alert" className="mt-3">
                    {t.shareFailed}
                  </Notice>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "challenges" && (
          <ul className="grid gap-6 sm:grid-cols-2">
            {challenges.map((challenge) => (
              <li
                key={challenge.id}
                className={`rounded-panel bg-paper p-6 ${challenge.done ? "shadow-raised outline-2 outline-offset-2 outline-basil" : "shadow-raised"}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-serif text-2xl tracking-tight">
                    {t.challengeNames[challenge.id]}
                  </h2>
                  {challenge.done ? (
                    <span className="text-sm font-medium text-basil">✓ {t.completed}</span>
                  ) : (
                    <span className="font-mono text-sm text-muted tabular-nums">
                      {challenge.progress}/{challenge.goal}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{t.challengeGoals[challenge.id]}</p>
                <div
                  className="mt-4 h-2.5 overflow-hidden rounded-full shadow-pressed-sm"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${Math.min(100, (challenge.progress / challenge.goal) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === "card" && (
          <div>
            <p className="max-w-xl leading-relaxed text-muted">{t.cardIntro}</p>
            <Button onClick={() => setCardOpen(true)} className="mt-4">
              {t.openCard}
            </Button>
          </div>
        )}
      </section>

      <div className="mt-16 border-t border-ink/15 pt-5">
        <Button onClick={clearAll} variant="danger" size="sm" className="-ml-3">
          {t.clearAll}
        </Button>
      </div>

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
