"use client";
import { useMemo, useSyncExternalStore } from "react";
import {
  currentPrefsValue,
  parsePrefs,
  serializePrefs,
  writePrefsCookie,
  type DinerPrefs,
} from "@/lib/diner-prefs";

const snapshot = currentPrefsValue;
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
