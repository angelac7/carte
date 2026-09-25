import { z } from "zod";
import { ALLERGENS, DIETARY_TAGS, type Allergen, type DietaryTag } from "@/lib/allergens";

// Saved on the diner's own device as a cookie, so filters follow them to every Carte menu
// without an account, and the server can show filtered results on the very first load.
export const PREFS_COOKIE = "carte-prefs";

/** How serious the diner says their allergies are, shown to staff on the allergy card. */
export const SEVERITIES = ["allergy", "severe", "intolerance"] as const;
export type Severity = (typeof SEVERITIES)[number];

export type DinerPrefs = {
  avoid: Allergen[];
  onlyTags: DietaryTag[];
  /** Also hide dishes that may contain traces of an avoided allergen. */
  hideTraces: boolean;
  severity?: Severity;
};

export const EMPTY_PREFS: DinerPrefs = {
  avoid: [],
  onlyTags: [],
  hideTraces: false,
  severity: "allergy",
};

const PrefsSchema = z.object({
  avoid: z.array(z.enum(ALLERGENS)).catch([]),
  onlyTags: z.array(z.enum(DIETARY_TAGS)).catch([]),
  hideTraces: z.boolean().catch(false),
  severity: z.enum(SEVERITIES).catch("allergy"),
});

/** Reads saved filters, ignoring anything unexpected. */
export function parsePrefs(raw: string | undefined): DinerPrefs {
  if (!raw) return EMPTY_PREFS;
  try {
    return PrefsSchema.parse(JSON.parse(decodeURIComponent(raw)));
  } catch {
    return EMPTY_PREFS;
  }
}

export function serializePrefs(prefs: DinerPrefs): string {
  return encodeURIComponent(JSON.stringify(prefs));
}

/** Browser only: saves filters on this device for a year. */
export function writePrefsCookie(prefs: DinerPrefs): void {
  document.cookie = `${PREFS_COOKIE}=${serializePrefs(prefs)}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new Event("carte-prefs-change"));
  try {
    localStorage.setItem("carte-prefs-change", String(Date.now()));
  } catch {
    /* Cookies remain available without localStorage. */
  }
}
