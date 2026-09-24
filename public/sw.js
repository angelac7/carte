// Carte's service worker: keeps opened menus and My Carte available offline.
// Menus are fetched fresh whenever there's a connection; the saved copy is only a fallback.
const CACHE = "carte-v3";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        const response = await fetch("/my");
        if (!response.ok) return;
        await cache.put("/my", response.clone());
        // Preload the offline shell's scripts, styles, and fonts even before /my is visited.
        const html = await response.text();
        const assets = [...new Set(html.match(/\/_next\/static\/[^"'\\\s<>]+/g) || [])];
        await Promise.all(assets.map((asset) => cache.add(asset).catch(() => {})));
      })
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("carte-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // App code and styles never change once built, so the saved copy is always right.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
            return response;
          }),
      ),
    );
    return;
  }

  // Diner menus and My Carte: try the network first, fall back to the saved copy offline.
  const isOfflinePage =
    request.mode === "navigate" && (url.pathname.startsWith("/r/") || url.pathname === "/my");
  if (isOfflinePage) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
          }
          return response;
        })
        .catch(async () => {
          const cached = (await caches.match(request)) || (await caches.match("/my"));
          if (!cached) return Response.error();
          const headers = new Headers(cached.headers);
          headers.delete("content-length");
          headers.delete("content-encoding");
          headers.set("cache-control", "no-store");
          const html = (await cached.text()).replace(
            "</head>",
            "<script>window.__carteOffline=true</script></head>",
          );
          return new Response(html, { status: cached.status, headers });
        }),
    );
  }
});

// The first visit may finish before the worker takes control. Save that document too.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "cache-page") return;
  let url;
  try {
    url = new URL(event.data.url);
  } catch {
    return;
  }
  if (
    url.origin !== self.location.origin ||
    !(url.pathname.startsWith("/r/") || url.pathname === "/my")
  )
    return;
  event.waitUntil(
    (async () => {
      const response = await fetch(url.href);
      if (!response.ok) return;
      const cache = await caches.open(CACHE);
      await cache.put(url.href, response.clone());
      const assets = [
        ...new Set((await response.text()).match(/\/_next\/static\/[^"'\\\s<>]+/g) || []),
      ];
      await Promise.all(assets.map((asset) => cache.add(asset).catch(() => {})));
    })().catch(() => {}),
  );
});
