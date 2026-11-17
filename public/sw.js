const CACHE = "routino-shell-v1";
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(["/dashboard", "/favicon.svg", "/manifest.webmanifest"]);
    const shell = await cache.match("/dashboard");
    const html = await shell.text();
    const assets = [...new Set(Array.from(html.matchAll(/(?:src|href)="([^" ]*\/_next\/static\/[^" ]+)"/g), match => match[1].replace(/&amp;/g, "&")))];
    await cache.addAll(assets);
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("routino-shell-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;
  if (request.mode === "navigate" && url.pathname === "/dashboard") {
    event.respondWith(fetch(request).then(async response => {
      if (response.ok && new URL(response.url).pathname === "/dashboard") { const cache = await caches.open(CACHE); await cache.put("/dashboard", response.clone()); }
      return response;
    }).catch(async () => (await caches.match("/dashboard")) || Response.error()));
  } else if (url.pathname.startsWith("/_next/static/") || ["/favicon.svg", "/logo.svg", "/icon-192", "/icon-512"].includes(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(async response => {
      if (response.ok) { const cache = await caches.open(CACHE); await cache.put(request, response.clone()); }
      return response;
    })));
  }
});
