/* Simple PWA service worker: precache the app shell, network-first for
   navigations (so updates show), cache-first for static assets, never
   touch API/admin requests. */
const VERSION = "v2";
const STATIC_CACHE = "static-" + VERSION;
const PAGE_CACHE = "pages-" + VERSION;
const OFFLINE_URL = "/fa";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(["/fa", "/icons/icon-192.png"]).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => ![STATIC_CACHE, PAGE_CACHE].includes(k)).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // never cache API / admin / auth — always live
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/fa/admin") || url.pathname.startsWith("/en/admin")) return;

  // hashed static assets → cache-first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || /\.(?:woff2?|png|jpg|jpeg|svg|webp|css|js)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
        return res;
      }).catch(() => hit)),
    );
    return;
  }

  // page navigations → network-first, fall back to cache/offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(PAGE_CACHE).then((c) => c.put(request, copy));
        return res;
      }).catch(() => caches.match(request).then((hit) => hit || caches.match(OFFLINE_URL))),
    );
  }
});
