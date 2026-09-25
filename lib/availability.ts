import type { MenuItem } from "@/types/menu";

/** A restaurant's local date ("2026-09-25") and time ("14:05"). */
export type RestaurantClock = { date: string; time: string };

// Late service belongs to the day it started, so a dish sold out at 11 PM stays sold out at 1 AM.
const SERVICE_DAY_STARTS_AT_HOURS = 4;

function localParts(timezone: string, at: Date): RestaurantClock | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(at);
    const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return {
      date: `${part("year")}-${part("month")}-${part("day")}`,
      time: `${part("hour")}:${part("minute")}`,
    };
  } catch {
    return null;
  }
}

/** The restaurant's service day and local time right now, or null if its time zone is unknown. */
export function restaurantClock(timezone: string, now: Date = new Date()): RestaurantClock | null {
  const local = localParts(timezone, now);
  const serviceDay = localParts(
    timezone,
    new Date(now.getTime() - SERVICE_DAY_STARTS_AT_HOURS * 60 * 60 * 1000),
  );
  return local && serviceDay ? { date: serviceDay.date, time: local.time } : null;
}

/** "11:30" from a database time like "11:30:00"; empty when there's none. */
export function shortTime(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : "";
}

/** Whether a time falls in a serving window. A window that ends before it starts runs past midnight. */
export function inServingWindow(time: string, from: string, until: string): boolean {
  if (!from || !until) return true;
  return until <= from ? time >= from || time < until : time >= from && time < until;
}

export type Availability = "available" | "sold-out" | "not-now";

/** Whether diners can order a dish right now. */
export function dishAvailability(
  dish: Pick<MenuItem, "sold_out_on" | "available_from" | "available_until">,
  clock: RestaurantClock | null,
): Availability {
  if (!clock) return "available";
  if (dish.sold_out_on && dish.sold_out_on === clock.date) return "sold-out";
  const from = shortTime(dish.available_from);
  const until = shortTime(dish.available_until);
  return inServingWindow(clock.time, from, until) ? "available" : "not-now";
}
