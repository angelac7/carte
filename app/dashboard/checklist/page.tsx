import { recordReview } from "./actions";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { TranslateForPrint } from "@/components/owner/TranslateForPrint";
import { Button, ButtonLink } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { requireRestaurant } from "@/lib/auth";
import { listDishes } from "@/lib/db";
import { menuReviewDates, menuReviewTranslations } from "@/lib/db/menu-review";
import { REVIEW_STRINGS } from "@/lib/i18n/review-strings";
import { htmlLang, isLanguageCode, LANGUAGES } from "@/lib/languages";
import { ownerStrings } from "@/lib/owner-language";
import { publishChecklist } from "@/lib/publish-checklist";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { language } = await ownerStrings();
  return { title: `${REVIEW_STRINGS[language].title} | Carte` };
}
export default async function ChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; saved?: string; failed?: string }>;
}) {
  const { supabase, restaurant } = await requireRestaurant("/dashboard/checklist");
  const { t, language } = await ownerStrings();
  const s = REVIEW_STRINGS[language];
  const params = await searchParams;
  const target = params.lang && isLanguageCode(params.lang) ? params.lang : language;
  const dishes = await listDishes(supabase, restaurant.id);
  const [reviews, translations] = await Promise.all([
    menuReviewDates(supabase, restaurant.id),
    menuReviewTranslations(
      supabase,
      dishes.filter((d) => d.confirmed).map((d) => d.id),
      target,
    ),
  ]);
  const checks = publishChecklist(dishes, reviews, translations, target, new Date().getTime());
  const labels = {
    unconfirmed: t.review.filterReview,
    notes: s.notes,
    conflicts: s.conflicts,
    translations: s.translations,
    due: s.due,
  };
  const when = new Intl.DateTimeFormat(htmlLang(language), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: restaurant.timezone,
  });
  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12">
      <OwnerPageHeader title={s.title} intro={s.intro}>
        <ButtonLink href="/dashboard/review" variant="secondary">
          {t.nav.review}
        </ButtonLink>
        <ButtonLink href="/dashboard/history" variant="ghost">
          {t.nav.history}
        </ButtonLink>
      </OwnerPageHeader>
      {params.failed && (
        <Notice tone="warning" role="alert" className="mt-6">
          {t.api.dishConflict}
        </Notice>
      )}
      {params.saved && (
        <Notice className="mt-6" role="status">
          {t.review.confirmed}
        </Notice>
      )}
      <form className="mt-8 flex flex-wrap items-end gap-3">
        <label>
          {t.print.language}
          <select name="lang" defaultValue={target} className={fieldClass("mt-1")}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary">
          {t.print.show}
        </Button>
      </form>
      <div className="mt-8 space-y-6">
        {(Object.keys(checks) as (keyof typeof checks)[]).map((key) => (
          <section key={key} className="rounded-panel bg-paper p-6 shadow-raised">
            <h2 className="text-xl font-medium">
              {labels[key]} · {checks[key].length}
            </h2>
            {key === "due" && <p className="mt-2 text-sm text-muted">{s.interval}</p>}
            {checks[key].length > 0 && (
              <ul className="mt-3 list-disc space-y-1 ps-5">
                {checks[key].map((d) => (
                  <li key={d.id}>{d.name}</li>
                ))}
              </ul>
            )}
            {key === "translations" && checks.translations.length > 0 && (
              <div className="mt-4">
                <TranslateForPrint slug={restaurant.slug} language={target} />
              </div>
            )}
          </section>
        ))}
      </div>
      <section className="mt-10">
        <h2 className="text-2xl font-medium">{s.dates}</h2>
        <ul className="mt-4 divide-y divide-ink/10">
          {dishes
            .filter((d) => d.confirmed)
            .map((d) => (
              <li key={d.id} className="py-5">
                <h3 className="font-medium">{d.name}</h3>
                <p className="mt-1 text-sm text-muted">
                  {reviews[d.id] ? (
                    <time dateTime={reviews[d.id]}>{when.format(new Date(reviews[d.id]))}</time>
                  ) : (
                    s.unknown
                  )}
                </p>
                {!checks.unconfirmed.some((item) => item.id === d.id) &&
                  !checks.conflicts.some((item) => item.id === d.id) && (
                    <form action={recordReview} className="mt-3">
                      <input type="hidden" name="dish" value={d.id} />
                      <input type="hidden" name="revision" value={d.revision} />
                      <input type="hidden" name="lang" value={target} />
                      <label className="flex items-start gap-2 text-sm">
                        <input type="checkbox" name="checked" required className="mt-1" />
                        {s.attest}
                      </label>
                      <Button type="submit" variant="secondary" size="sm" className="mt-3">
                        {s.confirm}
                      </Button>
                    </form>
                  )}
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}
