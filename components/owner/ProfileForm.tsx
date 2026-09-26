"use client";
import { useActionState, useState } from "react";
import { saveProfileAction, type ProfileState } from "@/app/dashboard/profile/actions";
import { Button } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { useOwnerText } from "@/components/owner/OwnerLanguage";
import { fmt } from "@/lib/i18n/owner/format";
import { htmlLang } from "@/lib/languages";
import { KITCHEN_PRACTICES } from "@/lib/allergens";
import { CONVERTIBLE_CURRENCIES } from "@/lib/prices";
import { DINER_STRINGS } from "@/lib/i18n/diner-strings";
import { DISCOVER_STRINGS } from "@/lib/i18n/discover-strings";
import {
  OCCASIONS,
  RESTAURANT_FEATURES,
  PRICE_RANGES,
  TIMEZONES,
  WEEKDAYS,
  type RestaurantProfile,
  type Weekday,
} from "@/lib/restaurant-profile";

/** A weekday's name in the owner's language, from a week that starts on a Monday. */
function dayName(day: Weekday, locale: string): string {
  const date = new Date(Date.UTC(2024, 0, 1 + WEEKDAYS.indexOf(day), 12));
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(date);
}

const inputClass = fieldClass("mt-1 text-base");
const timeClass = fieldClass("w-auto bg-paper px-2 py-1.5");
const checkboxClass = "h-5 w-5 accent-accent";

const chipClass =
  "cursor-pointer rounded-full bg-paper px-4 py-2.5 text-sm font-medium text-muted shadow-raised-sm transition-[box-shadow,background-color,color] duration-200 hover:text-ink has-checked:bg-basil has-checked:text-white has-checked:shadow-pressed-color has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-accent";

export function ProfileForm({ profile }: { profile: RestaurantProfile }) {
  const { t, language } = useOwnerText();
  const p = t.profile;
  const locale = htmlLang(language);
  const d = DINER_STRINGS[language];
  const currencyNames = new Intl.DisplayNames(locale, { type: "currency" });
  const currencyName = (code: string) => currencyNames.of(code) ?? code;
  const [draft, setDraft] = useState(profile);
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    saveProfileAction,
    {},
  );

  return (
    <form action={formAction} className="mt-10 space-y-8">
      <input type="hidden" name="revision" value={state.revision ?? draft.revision ?? ""} />
      <label className="block">
        <span className={labelClass}>{p.name}</span>
        <input
          name="name"
          required
          maxLength={120}
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-muted">{p.nameHint}</span>
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
          <span className="font-medium">{p.listed}</span>
          <span className="mt-1 block text-sm text-muted">{p.listedHint}</span>
        </span>
      </label>

      <label className="block">
        <span className={labelClass}>{p.description}</span>
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
          placeholder={p.descriptionPlaceholder}
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>{p.cuisine}</span>
          <input
            name="cuisine"
            maxLength={60}
            value={draft.cuisine}
            onChange={(event) =>
              setDraft({ ...draft, cuisine: event.target.value as RestaurantProfile["cuisine"] })
            }
            placeholder={p.cuisinePlaceholder}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>{p.city}</span>
          <input
            name="city"
            maxLength={80}
            value={draft.city}
            onChange={(event) =>
              setDraft({ ...draft, city: event.target.value as RestaurantProfile["city"] })
            }
            placeholder={p.cityPlaceholder}
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>{p.address}</span>
        <input
          name="address"
          maxLength={200}
          value={draft.address}
          onChange={(event) =>
            setDraft({ ...draft, address: event.target.value as RestaurantProfile["address"] })
          }
          placeholder={p.addressPlaceholder}
          className={inputClass}
        />
      </label>

      <fieldset>
        <legend className="eyebrow text-muted">{p.contact}</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>{p.phone}</span>
            <input
              name="phone"
              type="tel"
              maxLength={40}
              autoComplete="tel"
              value={draft.phone}
              onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
              placeholder="(607) 555-0123"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>{p.website}</span>
            <input
              name="website"
              inputMode="url"
              maxLength={300}
              value={draft.website}
              onChange={(event) => setDraft({ ...draft, website: event.target.value })}
              placeholder="example.com"
              className={inputClass}
            />
          </label>
        </div>
        <label className="mt-4 block">
          <span className={labelClass}>{p.reservation}</span>
          <input
            name="reservation_url"
            inputMode="url"
            maxLength={300}
            value={draft.reservation_url}
            onChange={(event) => setDraft({ ...draft, reservation_url: event.target.value })}
            placeholder={p.reservationPlaceholder}
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-muted">{p.contactHint}</span>
        </label>
      </fieldset>

      <fieldset>
        <legend className="eyebrow text-muted">{p.priceRange}</legend>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {[0, ...PRICE_RANGES].map((level) => (
            <label key={level} className={chipClass}>
              <input
                type="radio"
                name="price_range"
                value={level}
                checked={draft.price_range === level}
                onChange={() => setDraft({ ...draft, price_range: level })}
                className="sr-only"
              />
              {level === 0 ? p.notSet : "$".repeat(level)}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className={labelClass}>{p.currency}</span>
        <select
          name="currency"
          value={draft.currency}
          onChange={(event) => setDraft({ ...draft, currency: event.target.value })}
          className={inputClass}
        >
          <option value="">{p.currencyAuto}</option>
          {CONVERTIBLE_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {currencyName(code)} ({code})
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-muted">{p.currencyHint}</span>
      </label>

      <label className="block">
        <span className={labelClass}>{p.timezone}</span>
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
        <legend className="eyebrow text-muted">{p.hours}</legend>
        <p className="mt-1 text-xs text-muted">{p.hoursHint}</p>
        <div className="mt-3 divide-y divide-ink/10 rounded-panel bg-paper px-5 shadow-raised sm:px-6">
          {WEEKDAYS.map((day) => {
            const hours = draft.hours[day];
            const setHours = (value: RestaurantProfile["hours"][typeof day]) =>
              setDraft((current) => ({ ...current, hours: { ...current.hours, [day]: value } }));
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-28 text-sm font-medium">{dayName(day, locale)}</span>
                <input
                  type="time"
                  name={`${day}-open`}
                  value={hours?.open ?? "11:00"}
                  disabled={hours === null}
                  onChange={(event) =>
                    setHours({ open: event.target.value, close: hours?.close ?? "21:00" })
                  }
                  aria-label={fmt(p.opens, { day: dayName(day, locale) })}
                  className={timeClass}
                />
                <span className="text-sm text-muted">{p.to}</span>
                <input
                  type="time"
                  name={`${day}-close`}
                  value={hours?.close ?? "21:00"}
                  disabled={hours === null}
                  onChange={(event) =>
                    setHours({ open: hours?.open ?? "11:00", close: event.target.value })
                  }
                  aria-label={fmt(p.closes, { day: dayName(day, locale) })}
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
                  {p.closed}
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow text-muted">{p.goodFor}</legend>
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
              {DISCOVER_STRINGS[language].occasions[occasion]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow text-muted">{p.features}</legend>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {RESTAURANT_FEATURES.map((feature) => (
            <label key={feature} className={chipClass}>
              <input
                type="checkbox"
                name="feature"
                value={feature}
                checked={draft.features.includes(feature)}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    features: event.target.checked
                      ? [...draft.features, feature]
                      : draft.features.filter((value) => value !== feature),
                  })
                }
                className="sr-only"
              />
              {d.features[feature]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow text-muted">{p.kitchen}</legend>
        <p className="mt-2 text-sm text-muted">{p.kitchenHint}</p>
        <div className="mt-3 space-y-2.5">
          {KITCHEN_PRACTICES.map((practice) => (
            <label key={practice} className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="kitchen_practice"
                value={practice}
                checked={draft.kitchen_practices.includes(practice)}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    kitchen_practices: event.target.checked
                      ? [...draft.kitchen_practices, practice]
                      : draft.kitchen_practices.filter((value) => value !== practice),
                  })
                }
                className={`mt-0.5 ${checkboxClass}`}
              />
              {d.kitchenPractices[practice]}
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && (
        <Notice tone="warning" role="alert">
          {state.error}
          <Button type="button" onClick={() => window.location.reload()} className="ms-3">
            {p.reload}
          </Button>
        </Notice>
      )}
      {state.saved && (
        <Notice tone="success" role="status">
          {p.saved}
        </Notice>
      )}

      <Button type="submit" disabled={pending} shine>
        {pending ? p.saving : p.save}
      </Button>
    </form>
  );
}
