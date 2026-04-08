const CACHE_NAME = "g12-paris-cache-v4";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo.png",
  "/favicon.ico",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

// Installation du Service Worker et mise en cache initiale
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[SW] Cache ouvert : ", CACHE_NAME);
      // On utilise une approche plus permissive pour ne pas bloquer l'install
      // si un seul fichier échoue (comme logo.png s'il n'existe pas encore)
      return Promise.allSettled(
        urlsToCache.map(url => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

// Interception des requêtes réseau
self.addEventListener("fetch", event => {
  // On ne gère que les requêtes GET (pour éviter les erreurs sur POST/TRPC)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Si on a le fichier en cache, on le retourne
      if (cachedResponse) {
        return cachedResponse;
      }

      // Sinon on tente le réseau avec une gestion d'erreur robuste
      return fetch(event.request)
        .then(networkResponse => {
          // Vérifier si la réponse est valide avant de la mettre en cache (optionnel)
          // Pour l'instant on retourne juste la réponse réseau
          return networkResponse;
        })
        .catch(error => {
          console.error("[SW] Échec du fetch pour :", event.request.url, error);
          // On pourrait retourner une page d'erreur offline ici
          // Mais au moins on ne fait plus planter la promesse respondWith
          throw error;
        });
    })
  );
});

// Nettoyage des anciens caches lors de l'activation
self.addEventListener("activate", event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log("[SW] Suppression de l'ancien cache :", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Prend le contrôle immédiatement des clients ouverts
      return self.clients.claim();
    })
  );
});
