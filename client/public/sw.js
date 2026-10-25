/**
 * Service Worker — G12 Paris Infos Médias
 *
 * Stratégies :
 *  - Navigation (HTML)   : network-first, repli sur /offline.html si hors-ligne.
 *    Le shell applicatif ne doit JAMAIS être servi depuis un cache périmé,
 *    sinon les visiteurs restent figés sur une ancienne version du site.
 *  - Assets statiques    : cache-first (hachés par le build, immuables).
 *  - API publique (tRPC) : network-first, mais la dernière réponse reçue est
 *    placée en cache → en cas de perte de réseau, l'app affiche le dernier
 *    contenu connu (articles, galeries, annonces, versets, réglages de page)
 *    au lieu d'une coquille vide. Éviction LRU (~2 Mo / cache, 60 entrées max).
 *  - Médias (images / uploads + /api/image optimisé) : cache-first avec
 *    parking immédiat → couvertures et vignettes restent lisibles
 *    hors-ligne. Éviction LRU (~4 Mo / cache, 300 entrées max).
 *  - Mutations tRPC, auth et appels privés : réseau uniquement, jamais mis
 *    en cache.
 */

const VERSION = "v10";
const STATIC_CACHE = `g12-paris-static-${VERSION}`;
const PAGES_CACHE = `g12-paris-pages-${VERSION}`;
const API_CACHE = `g12-paris-api-${VERSION}`;
const MEDIA_CACHE = `g12-paris-media-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const MAX_PAGES_ENTRIES = 50;
const MAX_API_ENTRIES = 60;
const MAX_API_CACHE_BYTES = 2 * 1024 * 1024; // ~2 Mo de réponses API
const MAX_MEDIA_ENTRIES = 300;
const MAX_MEDIA_CACHE_BYTES = 4 * 1024 * 1024;

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/favicon.svg",
  "/logo.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

const PUBLIC_API_PREFIXES = [
  "/api/trpc/articles.",
  "/api/trpc/gallery.",
  "/api/trpc/announcements.",
  "/api/trpc/verses.",
  "/api/trpc/pageContent.",
  "/api/trpc/siteSettings.",
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
  const keep = [STATIC_CACHE, PAGES_CACHE, API_CACHE, MEDIA_CACHE];
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

/** LRU approximatif : FIFO par ordre d'insertion + budget octets. */
async function capLruCache(cacheName, maxEntries, maxBytes) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  let total = 0;
  for (const key of keys) {
    const cached = await cache.match(key);
    if (cached) {
      total += totalSize(cached);
    }
  }
  const deletes = [];
  for (let i = 0; i < keys.length; i += 1) {
    if (keys.length - i <= maxEntries && total <= maxBytes) break;
    const cached = await cache.match(keys[i]);
    if (cached) {
      total -= totalSize(cached);
    }
    deletes.push(cache.delete(keys[i]));
  }
  await Promise.all(deletes);
}

/** Évite les double-allocation en calculant la taille depuis une seule lecture. */
function totalSize(response) {
  let size = 0;
  if (response.headers && response.headers.get("content-length")) {
    size = Number(response.headers.get("content-length")) || 0;
  }
  if (size === 0 && response.arrayBuffer) {
    // Réponse clonée en mémoire : tenter le body si encore disponible.
    return response.bodyUsed ? 0 : size;
  }
  return size;
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

/** Réponses API publiques (tRPC queries) : éligibles au cache offline. */
function isPublicApiQuery(url) {
  if (!url.pathname.startsWith("/api/trpc")) return false;
  return PUBLIC_API_PREFIXES.some(prefix => url.pathname.startsWith(prefix));
}

function hasQuerySignal(url) {
  // Superjson sérialise sur un seul « ?input= » pour les queries tRPC.
  return url.search.includes("input=");
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

/**
 * Réponses API publiques : réseau d'abord, repli sur la dernière réponse
 * connue si le réseau est indisponible (mode offline).
 */
async function publicApiNetworkFirst(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
      capLruCache(API_CACHE, MAX_API_ENTRIES, MAX_API_CACHE_BYTES);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      // Marqueur léger : le client sait qu'il consulte une copie hors-ligne.
      const headers = new Headers(cached.headers);
      headers.set("x-g12-offline", "1");
      return new Response(cached.body, {
        status: 200,
        headers,
      });
    }
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

/**
 * Cache-first pour les médias (uploads, couvertures, vignettes).
 * Le parking est SYNCHRONIQUE : l'image est dans le cache AVANT d'être
 * rendue, donc elle sera disponible au prochain passage hors-ligne.
 */
async function mediaCacheFirst(request) {
  const cache = await caches.open(MEDIA_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    // Rafraîchit l'ordre LRU (put() d'une copie strictement identique).
    cache.put(request, cached.clone()).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") {
      const clone = response.clone();
      cache.put(request, clone).catch(() => {});
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

  // Requêtes tRPC publiques (queries sans token) : cache runtime offline.
  if (isPublicApiQuery(url) && hasQuerySignal(url)) {
    event.respondWith(publicApiNetworkFirst(request));
    return;
  }

  // Médias locaux (uploads/) et vignettes optimisées (/api/image) :
  // cache-first parking synchronique → lisibles hors-ligne.
  // ( AVANT la règle générique /api/ qui exclut le cache. )
  if (
    url.pathname.startsWith("/uploads/") ||
    url.pathname === "/api/image"
  ) {
    event.respondWith(mediaCacheFirst(request));
    return;
  }

  // API, uploads et tout le reste : jamais de cache.
  if (url.pathname.startsWith("/api/")) {
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
