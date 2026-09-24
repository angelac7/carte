import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

it("caches the initial menu and its assets, then serves it without a connection", async () => {
  const handlers: Record<string, (event: Record<string, unknown>) => void> = {};
  const stored = new Map();
  const cache = {
    put: vi.fn(async (key, value) => {
      stored.set(typeof key === "string" ? key : key.url, value);
    }),
    add: vi.fn(async () => {}),
  };
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response('<script src="/_next/static/menu.js"></script>'));
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    self: {
      addEventListener: (type: string, callback: (typeof handlers)[string]) => {
        handlers[type] = callback;
      },
      location: { origin: "https://carte.test" },
    },
    caches: {
      open: async () => cache,
      match: async (key: string | Request) => stored.get(typeof key === "string" ? key : key.url),
    },
    fetch,
    URL,
  });
  let pending!: Promise<void>;
  const url = "https://carte.test/r/cafe";
  handlers.message({
    data: { type: "cache-page", url },
    waitUntil: (promise: Promise<void>) => {
      pending = promise;
    },
  });
  await pending;
  expect(stored.has(url)).toBe(true);
  expect(cache.add).toHaveBeenCalledWith("/_next/static/menu.js");
  fetch.mockRejectedValue(new Error("offline"));
  let response!: Promise<Response>;
  handlers.fetch({
    request: { url, method: "GET", mode: "navigate" },
    respondWith: (promise: Promise<Response>) => {
      response = promise;
    },
  });
  expect(await (await response).text()).toContain("menu.js");
});
