"use client";
import { useActionState, useState } from "react";
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
  const [draft, setDraft] = useState(profile);
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    saveProfileAction,
    {},
  );

  return (
    <form action={formAction} className="mt-10 space-y-8">
      <input type="hidden" name="revision" value={state.revision ?? draft.revision ?? ""} />
      <label className="block">
        <span className={labelClass}>Restaurant name</span>
        <input
          name="name"
          required
          maxLength={120}
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-muted">
          Shown in large type at the top of your diner menu.
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-4 rounded-panel bg-paper p-6 shadow-raised transition-[outline-color] has-checked:outline-2 has-checked:outline-offset-2 has-checked:outline-basil">
        <input
          type="checkbox"
          name="listed"
          checked={draft.listed}
          onChange={(event) => setDraft({ ...draft, listed: event.target.checked })}
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
          value={draft.description}
          onChange={(event) =>
            setDraft({
              ...draft,
              description: event.target.value as RestaurantProfile["description"],
            })
          }
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
            value={draft.cuisine}
            onChange={(event) =>
              setDraft({ ...draft, cuisine: event.target.value as RestaurantProfile["cuisine"] })
            }
            placeholder="Korean"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>City</span>
          <input
            name="city"
            maxLength={80}
            value={draft.city}
            onChange={(event) =>
              setDraft({ ...draft, city: event.target.value as RestaurantProfile["city"] })
            }
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
          value={draft.address}
          onChange={(event) =>
            setDraft({ ...draft, address: event.target.value as RestaurantProfile["address"] })
          }
          placeholder="123 Main Street"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Time zone</span>
        <select
          name="timezone"
          value={draft.timezone}
          onChange={(event) =>
            setDraft({ ...draft, timezone: event.target.value as RestaurantProfile["timezone"] })
          }
          className={inputClass}
        >
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
            const hours = draft.hours[day];
            const setHours = (value: RestaurantProfile["hours"][typeof day]) =>
              setDraft((current) => ({ ...current, hours: { ...current.hours, [day]: value } }));
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-24 text-sm font-medium">{DAY_LABELS[day]}</span>
                <input
                  type="time"
                  name={`${day}-open`}
                  value={hours?.open ?? "11:00"}
                  disabled={hours === null}
                  onChange={(event) =>
                    setHours({ open: event.target.value, close: hours?.close ?? "21:00" })
                  }
                  aria-label={`${DAY_LABELS[day]} opening time`}
                  className={timeClass}
                />
                <span className="text-sm text-muted">to</span>
                <input
                  type="time"
                  name={`${day}-close`}
                  value={hours?.close ?? "21:00"}
                  disabled={hours === null}
                  onChange={(event) =>
                    setHours({ open: hours?.open ?? "11:00", close: event.target.value })
                  }
                  aria-label={`${DAY_LABELS[day]} closing time`}
                  className={timeClass}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name={`${day}-closed`}
                    checked={hours === null}
                    onChange={(event) =>
                      setHours(event.target.checked ? null : { open: "11:00", close: "21:00" })
                    }
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
                checked={draft.occasions.includes(occasion)}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    occasions: event.target.checked
                      ? [...draft.occasions, occasion]
                      : draft.occasions.filter((value) => value !== occasion),
                  })
                }
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
          <Button type="button" onClick={() => window.location.reload()} className="ml-3">
            Reload latest profile
          </Button>
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
