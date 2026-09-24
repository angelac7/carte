"use client";
import { useActionState } from "react";
import { saveProfileAction, type ProfileState } from "@/app/dashboard/profile/actions";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
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

const inputClass = fieldClass("mt-1 text-base");
const timeClass = fieldClass("w-auto bg-paper px-2 py-1.5");
const checkboxClass = "h-5 w-5 accent-accent";
const chipClass =
  "cursor-pointer rounded-full bg-paper px-4 py-2.5 text-sm font-medium text-muted shadow-raised-sm transition-[box-shadow,background-color,color] duration-200 hover:text-ink has-checked:bg-basil has-checked:text-white has-checked:shadow-pressed-color has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-accent";

export function ProfileForm({ profile }: { profile: RestaurantProfile }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    saveProfileAction,
    {},
  );

  return (
    <form action={formAction} className="mt-10 space-y-8">
      <label className="flex cursor-pointer items-start gap-4 rounded-panel bg-paper p-6 shadow-raised transition-[outline-color] has-checked:outline-2 has-checked:outline-offset-2 has-checked:outline-basil">
        <input
          type="checkbox"
          name="listed"
          defaultChecked={profile.listed}
          className={`mt-1 ${checkboxClass}`}
        />
        <span>
          <span className="font-medium">Show my restaurant on Carte Discover</span>
          <span className="mt-1 block text-sm text-muted">
            Diners can find your restaurant and confirmed dishes in search. Turn this off anytime.
          </span>
        </span>
      </label>

      <label className="block">
        <span className={labelClass}>Short description</span>
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
          <span className={labelClass}>Cuisine</span>
          <input
            name="cuisine"
            maxLength={60}
            defaultValue={profile.cuisine}
            placeholder="Korean"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>City</span>
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
        <span className={labelClass}>Address</span>
        <input
          name="address"
          maxLength={200}
          defaultValue={profile.address}
          placeholder="123 Main Street"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Time zone</span>
        <select name="timezone" defaultValue={profile.timezone} className={inputClass}>
          {TIMEZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className="eyebrow text-muted">Opening hours</legend>
        <p className="mt-1 text-xs text-muted">
          If you close after midnight, set a closing time earlier than the opening time.
        </p>
        <div className="mt-3 divide-y divide-ink/10 rounded-panel bg-paper px-5 shadow-raised sm:px-6">
          {WEEKDAYS.map((day) => {
            const hours = profile.hours[day];
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-24 text-sm font-medium">{DAY_LABELS[day]}</span>
                <input
                  type="time"
                  name={`${day}-open`}
                  defaultValue={hours?.open ?? "11:00"}
                  aria-label={`${DAY_LABELS[day]} opening time`}
                  className={timeClass}
                />
                <span className="text-sm text-muted">to</span>
                <input
                  type="time"
                  name={`${day}-close`}
                  defaultValue={hours?.close ?? "21:00"}
                  aria-label={`${DAY_LABELS[day]} closing time`}
                  className={timeClass}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name={`${day}-closed`}
                    defaultChecked={hours === null}
                    className={checkboxClass}
                  />
                  Closed
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow text-muted">Good for</legend>
        <div className="mt-3 flex flex-wrap gap-2.5">
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
        <Notice tone="warning" role="alert">
          {state.error}
        </Notice>
      )}
      {state.saved && (
        <Notice tone="success" role="status">
          Profile saved.
        </Notice>
      )}

      <Button type="submit" disabled={pending} shine>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
