import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";

/**
 * Error alerts go to Sentry, only when NEXT_PUBLIC_SENTRY_DSN is set. Reports carry what broke
 * and where, never who: no cookies, request bodies (which can hold a diner's allergies), query
 * strings (table codes, searches), network addresses, or clicks and typing.
 */
export function sentryOptions({
  // Written out in full so Next fills them in for the browser too.
  dsn = process.env.NEXT_PUBLIC_SENTRY_DSN,
  nodeEnv = process.env.NODE_ENV,
  vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV,
}: { dsn?: string; nodeEnv?: string; vercelEnv?: string } = {}) {
  dsn = dsn?.trim() || undefined;
  return {
    dsn,
    // Development errors show on screen already, so only the live site sends alerts.
    enabled: Boolean(dsn) && nodeEnv === "production",
    environment: vercelEnv || "production",
    sendDefaultPii: false,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  };
}

/** Cuts the query string and fragment off a URL or path. */
export function withoutQuery(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

/** Keeps only the page, method, and browser type from a report's request, and drops the user. */
export function scrubEvent<E extends ErrorEvent>(event: E): E {
  delete event.user;
  if (event.request) {
    const { method, url, headers } = event.request;
    const userAgent = headers?.["user-agent"] ?? headers?.["User-Agent"];
    event.request = {
      ...(method ? { method } : {}),
      ...(url ? { url: withoutQuery(url) } : {}),
      ...(userAgent ? { headers: { "user-agent": userAgent } } : {}),
    };
  }
  const nextjs = event.contexts?.nextjs;
  if (nextjs && typeof nextjs.request_path === "string") {
    nextjs.request_path = withoutQuery(nextjs.request_path);
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs
      .map(scrubBreadcrumb)
      .filter((crumb): crumb is Breadcrumb => crumb !== null);
  }
  return event;
}

// Clicks and typing can reveal which allergies a diner picked; console lines can hold anything.
const DROPPED_BREADCRUMBS = new Set(["ui.click", "ui.input", "console"]);

/** Drops clicks, typing, and console lines, and cuts query strings from page and request URLs. */
export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb | null {
  if (crumb.category && DROPPED_BREADCRUMBS.has(crumb.category)) return null;
  if (!crumb.data) return crumb;
  const data = { ...crumb.data };
  for (const key of ["url", "from", "to"]) {
    if (typeof data[key] === "string") data[key] = withoutQuery(data[key]);
  }
  return { ...crumb, data };
}
