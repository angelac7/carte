"use client";
import { useSyncExternalStore } from "react";
import { EMPTY_MY_CARTE, parseMyCarte, type MyCarte } from "@/lib/my-carte";

const STORAGE_KEY = "carte-my-carte";
const CHANGE_EVENT = "carte-my-carte-change";

let cachedRaw: string | null | undefined;
let cachedValue: MyCarte = EMPTY_MY_CARTE;

function getSnapshot(): MyCarte {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable, e.g. in some private browsing modes.
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parseMyCarte(raw);
  }
  return cachedValue;
}

function getServerSnapshot(): MyCarte {
  return EMPTY_MY_CARTE;
}

function subscribe(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

/** The diner's saved dishes, diary, and more, kept in sync across the page and other tabs. */
export function useMyCarte(): MyCarte {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Saves a change on this device and updates every part of the page that shows it. */
export function updateMyCarte(change: (current: MyCarte) => MyCarte): boolean {
  const current = getSnapshot();
  const next = change(current);
  if (next === current) return true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return true;
}
