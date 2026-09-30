/**
 * Service Worker — G12 Paris Infos Médias
 *
 * Stratégies :
 *  - Navigation (HTML)  : network-first, repli sur /offline.html si hors-ligne.
 *    Le shell applicatif ne doit JAMAIS être servi depuis un cache périmé,
 *    sinon les visiteurs restent figés sur une ancienne version du site.
 *  - Assets statiques    : cache-first (hachés par le build, immuables).
 *  - API / navigations    : réseau uniquement, jamais mis en cache.
 */

const VERSION = "v9";
const STATIC_CACHE = `g12-paris-static-${VERSION}`;
const PAGES_CACHE = `g12-paris-pages-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const MAX_PAGES_ENTRIES = 50;

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/favicon.svg",
  "/logo.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // allSettled : l'installation ne doit pas échouer si un asset manque
      .then(cache => Promise.allSettled(PRECACHE_URLS.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  const keep = [STATIC_CACHE, PAGES_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(key => !keep.includes(key)).map(key => caches.delete(key))
        )
      )
      .then(() => trimCache(PAGES_CACHE, MAX_PAGES_ENTRIES))
      .then(() => self.clients.claim())
  );
});

/** Évite la croissance illimitée du cache des navigations. */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  // `keys()` est ordonné par ordre d'insertion : on retire les plus anciens.
  await Promise.all(
    keys.slice(0, keys.length - maxEntries).map(key => cache.delete(key))
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/widget/") ||
    /\.(?:css|js|woff2?|ttf|otf|png|jpe?g|webp|avif|svg|ico|mp3|wav|ogg|mp4|webm)$/i.test(
      url.pathname
    )
  );
}

/** Network-first : sert la version fraîche, met à jour le cache en arrière-plan. */
async function networkFirst(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
      trimCache(PAGES_CACHE, MAX_PAGES_ENTRIES);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("Hors connexion", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

/** Cache-first : pour les assets immuables produits par le build. */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 504, statusText: "Gateway Timeout" });
  }
}

self.addEventListener("fetch", event => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Requêtes inter-origines : laisser passer au réseau, sans interception.
  if (url.origin !== self.location.origin) return;

  // API, tRPC, uploads : jamais de cache (données volatiles / privées).
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/uploads/") ||
    url.pathname.startsWith("/trpc")
  ) {
    return;
  }

  // Navigation : network-first pour ne jamais servir un HTML périmé.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
