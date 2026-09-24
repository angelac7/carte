"use client";
import { useEffect } from "react";

/** Turns on offline support in production. In development, removes it so code changes show up. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then((registration) =>
          registration.active?.postMessage({ type: "cache-page", url: location.href }),
        )
        .catch(() => {});
    } else {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          registrations.forEach((registration) => registration.unregister()),
        );
    }
  }, []);
  return null;
}
