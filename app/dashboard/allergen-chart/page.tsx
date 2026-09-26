import { AllergenChart } from "@/components/owner/AllergenChart";
import { OwnerPageHeader } from "@/components/owner/OwnerPageHeader";
import { PrintButton } from "@/components/PrintButton";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { requireRestaurant } from "@/lib/auth";
import { getConfirmedDishes } from "@/lib/db";
import { htmlLang, isLanguageCode, LANGUAGES, type LanguageCode } from "@/lib/languages";
import { ownerStrings, ownerTitle } from "@/lib/owner-language";

export const dynamic = "force-dynamic";
export const generateMetadata = () => ownerTitle((t) => t.chart.title);

export default async function AllergenChartPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { supabase, restaurant } = await requireRestaurant("/dashboard/allergen-chart");
  const dishes = await getConfirmedDishes(supabase, restaurant.id);
  const { t } = await ownerStrings();
  const source = dishes.find((dish) => dish.source_language && isLanguageCode(dish.source_language))
    ?.source_language as LanguageCode | undefined;
  const requested = (await searchParams).lang ?? "";
  const language: LanguageCode = isLanguageCode(requested) ? requested : (source ?? "en");
  const printedOn = new Intl.DateTimeFormat(htmlLang(language), { dateStyle: "long" }).format(
    new Date(),
  );

  return (
    <main id="main" className="mx-auto max-w-6xl px-5 py-12 print:max-w-none print:p-0">
      {/* Wide enough for all 14 allergens on one page. */}
      <style>{"@page { size: landscape; margin: 10mm; }"}</style>
      <div className="print:hidden">
        <OwnerPageHeader title={t.chart.title} intro={t.chart.intro} />
        <form className="mt-8 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="eyebrow text-muted">{t.print.language}</span>
            <select name="lang" defaultValue={language} className={fieldClass("mt-1 w-auto")}>
              {LANGUAGES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="secondary">
            {t.print.show}
          </Button>
          <PrintButton label={t.print.printButton} />
        </form>
        {dishes.length === 0 && <Notice className="mt-6">{t.chart.confirmFirst}</Notice>}
      </div>

      {dishes.length > 0 && (
        <div className="mt-8 print:mt-0">
          <AllergenChart
            restaurantName={restaurant.name}
            dishes={dishes}
            language={language}
            kitchenPractices={restaurant.kitchen_practices}
            printedOn={printedOn}
          />
        </div>
      )}
    </main>
  );
}
