"use client";
import { useMemo, useSyncExternalStore } from "react";
import {
  EMPTY_PREFS,
  PREFS_COOKIE,
  parsePrefs,
  serializePrefs,
  writePrefsCookie,
  type DinerPrefs,
} from "@/lib/diner-prefs";

function snapshot(): string {
  return (
    document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${PREFS_COOKIE}=`))
      ?.slice(PREFS_COOKIE.length + 1) ?? serializePrefs(EMPTY_PREFS)
  );
}
function subscribe(listener: () => void) {
  window.addEventListener("carte-prefs-change", listener);
  window.addEventListener("storage", listener);
  window.addEventListener("focus", listener);
  return () => {
    window.removeEventListener("carte-prefs-change", listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener("focus", listener);
  };
}
/** Read current device preferences after hydration, including when HTML was cached offline. */
export function useDinerPrefs(initial: DinerPrefs) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => serializePrefs(initial));
  const prefs = useMemo(() => parsePrefs(raw), [raw]);
  return [prefs, writePrefsCookie] as const;
}
