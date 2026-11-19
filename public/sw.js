const CACHE = "routino-shell-v4";
self.addEventListener("message", event => { if (event.data?.type === "ACTIVATE_UPDATE") self.skipWaiting(); });
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(["/dashboard"]);
    const shell = await cache.match("/dashboard");
    if (!shell) throw new Error("Dashboard shell unavailable");
    const html = await shell.text();
    const assets = [...new Set(Array.from(html.matchAll(/(?:src|href)="([^" ]*\/_next\/static\/[^" ]+)"/g), match => match[1].replace(/&amp;/g, "&")))];
    if (!assets.length) throw new Error("Dashboard assets unavailable");
    const results = await Promise.allSettled(assets.map(async asset => {
      try { await cache.addAll([asset]); } catch { await cache.addAll([asset]); }
    }));
    if (results.some(result => result.status === "rejected")) throw new Error("Required offline assets could not be cached");
    await Promise.allSettled(["/favicon.svg", "/manifest.webmanifest"].map(asset => cache.addAll([asset])));
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("routino-shell-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;
  if (request.mode === "navigate" && ["/", "/dashboard"].includes(url.pathname)) {
    event.respondWith(fetch(request).catch(async () => (await (await caches.open(CACHE)).match("/dashboard")) || Response.error()));
  } else if (url.pathname.startsWith("/_next/static/") || ["/favicon.svg", "/logo.svg", "/icon-192", "/icon-512"].includes(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(async response => {
      if (response.ok) { const cache = await caches.open(CACHE); await cache.put(request, response.clone()); }
      return response;
    })));
  }
});
