"use client";
import { useActionState } from "react";
import { saveProfileAction, type ProfileState } from "@/app/dashboard/profile/actions";
import { DISCOVER_STRINGS } from "@/lib/i18n/discover-strings";
import {
  OCCASIONS,
  TIMEZONES,
  WEEKDAYS,
  type RestaurantProfile,
  type Weekday,
} from "@/lib/restaurant-profile";

const DAY_LABELS: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const inputClass =
  "mt-1 w-full rounded-md border border-line bg-card px-3 py-2 focus:border-ink focus:outline-none";
const chipClass =
  "cursor-pointer rounded-full border border-line px-3 py-1 text-sm text-muted hover:border-muted has-checked:border-basil has-checked:bg-basil has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-ink";

export function ProfileForm({ profile }: { profile: RestaurantProfile }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    saveProfileAction,
    {},
  );

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <label className="flex items-start gap-3 rounded-lg border border-line bg-card p-4">
        <input type="checkbox" name="listed" defaultChecked={profile.listed} className="mt-1" />
        <span>
          <span className="font-medium">Show my restaurant on Carte Discover</span>
          <span className="mt-1 block text-sm text-muted">
            Diners can find your restaurant and confirmed dishes in search. Turn this off anytime.
          </span>
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Short description</span>
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={profile.description}
          placeholder="For example: Modern Korean noodles and small plates in a cozy room."
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Cuisine</span>
          <input
            name="cuisine"
            maxLength={60}
            defaultValue={profile.cuisine}
            placeholder="Korean"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">City</span>
          <input
            name="city"
            maxLength={80}
            defaultValue={profile.city}
            placeholder="Ithaca"
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Address</span>
        <input
          name="address"
          maxLength={200}
          defaultValue={profile.address}
          placeholder="123 Main Street"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Time zone</span>
        <select name="timezone" defaultValue={profile.timezone} className={inputClass}>
          {TIMEZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className="text-sm font-medium">Opening hours</legend>
        <p className="mt-1 text-xs text-muted">
          If you close after midnight, set a closing time earlier than the opening time.
        </p>
        <div className="mt-2 divide-y divide-line rounded-lg border border-line bg-card px-4">
          {WEEKDAYS.map((day) => {
            const hours = profile.hours[day];
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-24 text-sm">{DAY_LABELS[day]}</span>
                <input
                  type="time"
                  name={`${day}-open`}
                  defaultValue={hours?.open ?? "11:00"}
                  aria-label={`${DAY_LABELS[day]} opening time`}
                  className="rounded-md border border-line bg-paper px-2 py-1 text-sm"
                />
                <span className="text-sm text-muted">to</span>
                <input
                  type="time"
                  name={`${day}-close`}
                  defaultValue={hours?.close ?? "21:00"}
                  aria-label={`${DAY_LABELS[day]} closing time`}
                  className="rounded-md border border-line bg-paper px-2 py-1 text-sm"
                />
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" name={`${day}-closed`} defaultChecked={hours === null} />
                  Closed
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">Good for</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {OCCASIONS.map((occasion) => (
            <label key={occasion} className={chipClass}>
              <input
                type="checkbox"
                name="occasion"
                value={occasion}
                defaultChecked={profile.occasions.includes(occasion)}
                className="sr-only"
              />
              {DISCOVER_STRINGS.en.occasions[occasion]}
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-md bg-tomato/10 px-3 py-2 text-sm text-tomato">
          {state.error}
        </p>
      )}
      {state.saved && (
        <p className="rounded-md bg-basil-soft px-3 py-2 text-sm text-basil">Profile saved.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
