import { z } from "zod";

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const OCCASIONS = [
  "date-night",
  "family",
  "groups",
  "quick-bite",
  "business",
  "late-night",
] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Ho_Chi_Minh",
  "Asia/Singapore",
  "Australia/Sydney",
] as const;
export const DEFAULT_TIMEZONE = "America/New_York";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DayHoursSchema = z
  .object({ open: z.string().regex(TIME), close: z.string().regex(TIME) })
  .nullable();

/** A day's hours, or null when closed. Closing before opening means past midnight. */
export const HoursSchema = z.object({
  mon: DayHoursSchema,
  tue: DayHoursSchema,
  wed: DayHoursSchema,
  thu: DayHoursSchema,
  fri: DayHoursSchema,
  sat: DayHoursSchema,
  sun: DayHoursSchema,
});
export type FullHours = z.infer<typeof HoursSchema>;
export type WeeklyHours = Partial<FullHours>;

export const DEFAULT_HOURS = Object.fromEntries(
  WEEKDAYS.map((day) => [day, { open: "11:00", close: "21:00" }]),
) as FullHours;

export const ProfileSchema = z.object({
  revision: z.number().int().positive().optional(),
  name: z.string().trim().max(120),
  listed: z.boolean(),
  description: z.string().trim().max(500),
  cuisine: z.string().trim().max(60),
  city: z.string().trim().max(80),
  address: z.string().trim().max(200),
  timezone: z.enum(TIMEZONES),
  hours: HoursSchema,
  occasions: z.array(z.enum(OCCASIONS)).max(OCCASIONS.length),
});
export type RestaurantProfile = z.infer<typeof ProfileSchema>;

export const DEFAULT_PROFILE: RestaurantProfile = {
  name: "",
  listed: false,
  description: "",
  cuisine: "",
  city: "",
  address: "",
  timezone: DEFAULT_TIMEZONE,
  hours: DEFAULT_HOURS,
  occasions: [],
};

export function isOccasion(value: string): value is Occasion {
  return (OCCASIONS as readonly string[]).includes(value);
}

/** Turns a database row into a complete profile, filling in defaults for anything unset. */
export function normalizeProfile(row: unknown): RestaurantProfile {
  const r = (row ?? {}) as Record<string, unknown>;
  const hours = HoursSchema.safeParse(r.hours);
  const timezone =
    typeof r.timezone === "string" && (TIMEZONES as readonly string[]).includes(r.timezone)
      ? r.timezone
      : DEFAULT_TIMEZONE;
  const parsed = ProfileSchema.safeParse({
    ...r,
    hours: hours.success ? hours.data : DEFAULT_HOURS,
    timezone,
  });
  return parsed.success ? parsed.data : DEFAULT_PROFILE;
}

/** True if open right now in the restaurant's time zone, false if closed, null if hours aren't set. */
export function isOpenNow(
  hours: WeeklyHours | null | undefined,
  timezone: string,
  now: Date = new Date(),
): boolean | null {
  if (!hours || Object.keys(hours).length === 0) return null;

  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
  } catch {
    return null;
  }

  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = part("weekday").toLowerCase().slice(0, 3) as Weekday;
  const time = `${part("hour").padStart(2, "0")}:${part("minute")}`;
  const todayIndex = WEEKDAYS.indexOf(weekday);
  if (todayIndex === -1) return null;

  const today = hours[weekday];
  const yesterday = hours[WEEKDAYS[(todayIndex + 6) % 7]];

  if (today) {
    const overnight = today.close <= today.open;
    if (overnight ? time >= today.open : time >= today.open && time < today.close) return true;
  }
  // Late hours carried over from yesterday, e.g. open until 2:00.
  if (yesterday && yesterday.close <= yesterday.open && time < yesterday.close) return true;
  return false;
}

/** A maps link for a restaurant's address. */
export function directionsUrl(name: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;
}
