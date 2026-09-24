"use client";
import { useSyncExternalStore } from "react";

function subscribe(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}
function snapshot() {
  return (
    !navigator.onLine || Boolean((window as Window & { __carteOffline?: boolean }).__carteOffline)
  );
}
/** Cached documents remain marked stale until the diner reloads a fresh copy. */
export function useOffline() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
