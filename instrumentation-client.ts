import { sentryOptions } from "@/lib/error-reporting";

// Error alerts in the browser. Sentry only downloads when it's switched on, so diners' phones
// don't load it otherwise.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  void import("@sentry/nextjs").then((Sentry) => Sentry.init(sentryOptions()));
}
