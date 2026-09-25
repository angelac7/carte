"use client";
import { useRef } from "react";
import { switchRestaurantAction } from "@/app/dashboard/actions";
import Link from "@/components/OfflineLink";
import { fieldClass } from "@/components/ui/field";
import type { Restaurant } from "@/lib/db";

/** Which location the dashboard shows, with a way to switch and to add another. */
export function LocationSwitcher({
  restaurants,
  currentId,
}: {
  restaurants: Restaurant[];
  currentId: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 pt-4 text-sm print:hidden">
      {restaurants.length > 1 && (
        <form ref={form} action={switchRestaurantAction} className="flex items-center gap-2">
          <label htmlFor="location" className="text-muted">
            Location
          </label>
          <select
            id="location"
            name="restaurant"
            defaultValue={currentId}
            onChange={() => form.current?.requestSubmit()}
            className={fieldClass("w-auto py-2")}
          >
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
                {restaurant.role === "editor" ? " (editor)" : ""}
              </option>
            ))}
          </select>
        </form>
      )}
      <Link
        href="/dashboard/setup?another=1"
        className="font-medium underline underline-offset-4 hover:text-accent"
      >
        Add a location
      </Link>
    </div>
  );
}
