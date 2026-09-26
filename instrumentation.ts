import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";
import { sentryOptions } from "@/lib/error-reporting";

/** Starts error alerts on the server. Does nothing until NEXT_PUBLIC_SENTRY_DSN is set. */
export function register() {
  Sentry.init(sentryOptions());
}

/** Reports server errors nothing else caught, and waits for the report to be sent. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  Sentry.captureRequestError(error, request, context);
  await Sentry.flush(2000);
};
