import * as Sentry from "@sentry/nextjs";
import { after } from "next/server";

/**
 * Server code only. For failures the app handles (showing the visitor a friendly message): logs it, and sends it to
 * error alerts so it isn't missed. `details` should describe the restaurant data involved, never
 * the visitor.
 */
export function reportError(label: string, err: unknown, details?: Record<string, string>) {
  console.error(`${label}:`, ...(details ? [details] : []), err);
  Sentry.withScope((scope) => {
    scope.setTag("failure", label);
    if (details) scope.setExtras(details);
    Sentry.captureException(err);
  });
  // Serverless functions can stop once the response is sent, so wait for the report to go out.
  try {
    after(() => Sentry.flush(2000));
  } catch {
    // Outside a request (tests, scripts): nothing to keep alive.
  }
}
