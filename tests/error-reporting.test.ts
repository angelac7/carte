import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/nextjs";
import { scrubBreadcrumb, scrubEvent, sentryOptions, withoutQuery } from "@/lib/error-reporting";

describe("sentryOptions", () => {
  it("stays off without a DSN, and in development", () => {
    expect(sentryOptions({ dsn: undefined, nodeEnv: "production" }).enabled).toBe(false);
    expect(sentryOptions({ dsn: "  ", nodeEnv: "production" }).enabled).toBe(false);
    expect(
      sentryOptions({ dsn: "https://k@o1.ingest.sentry.io/2", nodeEnv: "development" }).enabled,
    ).toBe(false);
  });

  it("turns on for the live site and never sends personal data by default", () => {
    const options = sentryOptions({
      dsn: "https://k@o1.ingest.sentry.io/2",
      nodeEnv: "production",
      vercelEnv: "preview",
    });
    expect(options.enabled).toBe(true);
    expect(options.environment).toBe("preview");
    expect(options.dataCollection).toMatchObject({
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    });
  });
});

describe("withoutQuery", () => {
  it("cuts query strings and fragments, which can hold table codes and searches", () => {
    expect(withoutQuery("https://carte.app/r/cart?table=abcdefgh23#order")).toBe(
      "https://carte.app/r/cart",
    );
    expect(withoutQuery("/discover?q=peanut")).toBe("/discover");
    expect(withoutQuery("/r/cart")).toBe("/r/cart");
  });
});

describe("scrubEvent", () => {
  it("keeps the page, method, and browser, and drops cookies, bodies, and the user", () => {
    const event = scrubEvent({
      type: undefined,
      user: { id: "owner-1", email: "owner@example.com", ip_address: "203.0.113.9" },
      request: {
        method: "POST",
        url: "https://carte.app/api/recommend?x=1",
        headers: {
          "user-agent": "Safari",
          cookie: "sb-auth=secret",
          "x-forwarded-for": "203.0.113.9",
        },
        cookies: { "carte-prefs": '{"avoid":["peanuts"]}' },
        data: { avoid: ["peanuts"], question: "no nuts please" },
        query_string: "x=1",
      },
      contexts: { nextjs: { request_path: "/r/cart?table=abcdefgh23", route_type: "render" } },
    } as ErrorEvent);
    expect(event.user).toBeUndefined();
    expect(event.request).toEqual({
      method: "POST",
      url: "https://carte.app/api/recommend",
      headers: { "user-agent": "Safari" },
    });
    expect(event.contexts?.nextjs).toEqual({ request_path: "/r/cart", route_type: "render" });
  });

  it("drops the values of variables in the failing code", () => {
    const event = scrubEvent({
      type: undefined,
      exception: {
        values: [
          {
            type: "Error",
            value: "AI failed",
            stacktrace: { frames: [{ function: "recommend", vars: { avoid: ["peanuts"] } }] },
          },
        ],
      },
    } as ErrorEvent);
    expect(event.exception?.values?.[0].stacktrace?.frames?.[0]).toEqual({ function: "recommend" });
  });

  it("scrubs breadcrumbs already on the report", () => {
    const event = scrubEvent({
      type: undefined,
      breadcrumbs: [
        { category: "ui.click", message: "button 'Peanuts'" },
        { category: "navigation", data: { from: "/r/cart?table=abcdefgh23", to: "/my" } },
      ],
    } as ErrorEvent);
    expect(event.breadcrumbs).toEqual([
      { category: "navigation", data: { from: "/r/cart", to: "/my" } },
    ]);
  });
});

describe("scrubBreadcrumb", () => {
  it("drops clicks, typing, and console lines, which can reveal a diner's allergies", () => {
    expect(scrubBreadcrumb({ category: "ui.click", message: "button 'Peanuts'" })).toBeNull();
    expect(scrubBreadcrumb({ category: "ui.input", message: "input" })).toBeNull();
    expect(scrubBreadcrumb({ category: "console", message: "anything" })).toBeNull();
  });

  it("keeps requests without their query strings", () => {
    expect(
      scrubBreadcrumb({
        category: "fetch",
        data: { method: "GET", url: "/api/table?code=abcdefgh23", status_code: 500 },
      }),
    ).toEqual({ category: "fetch", data: { method: "GET", url: "/api/table", status_code: 500 } });
  });
});
