"use client";
import { useRef } from "react";
import { setDashboardLanguageAction, switchRestaurantAction } from "@/app/dashboard/actions";
import Link from "@/components/OfflineLink";
import { useOwnerText } from "@/components/owner/OwnerLanguage";
import { fieldClass } from "@/components/ui/field";
import type { Restaurant } from "@/lib/db";

/**
 * Along the top of the dashboard: which location it shows, a way to add another, and the
 * dashboard's language.
 */
export function LocationSwitcher({
  restaurants,
  currentId,
  languages,
}: {
  restaurants: Restaurant[];
  currentId: string | null;
  languages: { code: string; label: string }[];
}) {
  const { t, language } = useOwnerText();
  const locationForm = useRef<HTMLFormElement>(null);
  const languageForm = useRef<HTMLFormElement>(null);
  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 pt-4 text-sm print:hidden">
      {restaurants.length > 1 && currentId && (
        <form
          ref={locationForm}
          action={switchRestaurantAction}
          className="flex items-center gap-2"
        >
          <label htmlFor="location" className="text-muted">
            {t.bar.location}
          </label>
          <select
            id="location"
            name="restaurant"
            defaultValue={currentId}
            onChange={() => locationForm.current?.requestSubmit()}
            className={fieldClass("w-auto py-2")}
          >
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
                {restaurant.role === "editor" ? ` ${t.bar.editor}` : ""}
              </option>
            ))}
          </select>
        </form>
      )}
      {currentId && (
        <Link
          href="/dashboard/setup?another=1"
          className="font-medium underline underline-offset-4 hover:text-accent"
        >
          {t.bar.addLocation}
        </Link>
      )}
      <form
        ref={languageForm}
        action={setDashboardLanguageAction}
        className="ms-auto flex items-center gap-2"
      >
        <label htmlFor="dashboard-language" className="text-muted">
          {t.bar.language}
        </label>
        <select
          id="dashboard-language"
          name="language"
          defaultValue={language}
          onChange={() => languageForm.current?.requestSubmit()}
          className={fieldClass("w-auto py-2")}
        >
          {languages.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </form>
    </div>
  );
}
