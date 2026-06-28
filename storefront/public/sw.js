/* KILL SWITCH.
   A previous service worker cached the app's JavaScript "cache-first", so
   browsers kept running stale code and it interfered with client-side
   navigation (links appeared to need two clicks). This version unregisters
   itself, wipes every cache, and reloads open tabs once. It installs no fetch
   handler, so it never intercepts requests again. */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((c) => c.navigate(c.url));
      } catch {
        /* best effort */
      }
    })(),
  );
});
