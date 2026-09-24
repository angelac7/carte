// Saved on the diner's device, so larger text and high contrast apply on every visit.
export const DISPLAY_COOKIE = "carte-display";

export type DisplayPrefs = { largeText: boolean; highContrast: boolean };

export const DEFAULT_DISPLAY: DisplayPrefs = { largeText: false, highContrast: false };

export function parseDisplay(raw: string | undefined): DisplayPrefs {
  if (!raw) return DEFAULT_DISPLAY;
  const parts = raw.split(".");
  return { largeText: parts.includes("large"), highContrast: parts.includes("contrast") };
}

export function serializeDisplay(prefs: DisplayPrefs): string {
  const parts = [prefs.largeText && "large", prefs.highContrast && "contrast"].filter(Boolean);
  return parts.length > 0 ? parts.join(".") : "default";
}

/** Browser only: saves display settings on this device for a year. */
export function writeDisplayCookie(prefs: DisplayPrefs): void {
  document.cookie = `${DISPLAY_COOKIE}=${serializeDisplay(prefs)}; path=/; max-age=31536000; samesite=lax`;
}

/** Browser only: applies display settings to the whole page. */
export function applyDisplay(prefs: DisplayPrefs): void {
  const root = document.documentElement;
  root.classList.toggle("large-text", prefs.largeText);
  root.classList.toggle("high-contrast", prefs.highContrast);
}
