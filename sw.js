const CACHE_NAME = 'periodental-v1';
const urlsToCache = [
  '/periodontograma-pwa.html',
  '/manifest.json',
  '/'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Cache abierto');
      return cache.addAll(urlsToCache).catch(err => {
        console.log('[Service Worker] Error cacheando URLs:', err);
        // Continuar incluso si falla el cache
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - estrategia network-first con fallback a cache
self.addEventListener('fetch', event => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cachear respuestas válidas
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(error => {
        // Si falla la red, usar cache
        console.log('[Service Worker] Error de fetch, usando cache:', error);
        return caches.match(event.request).then(response => {
          if (response) {
            return response;
          }
          
          // Si no hay cache, retornar página offline
          return caches.match('/periodontograma-pwa.html');
        });
      })
  );
});

// Sincronización en background
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Aquí irían operaciones de sincronización si fuera necesario
      Promise.resolve()
    );
  }
});

// Message handler para comunicación con la app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
