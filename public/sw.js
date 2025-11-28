// Service Worker for TravelAI PWA - Offline First
const CACHE_NAME = 'travelai-v2';
const STATIC_CACHE = 'travelai-static-v2';
const API_CACHE = 'travelai-api-v2';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API routes to cache with stale-while-revalidate
const API_ROUTES = [
  '/api/transactions',
  '/api/accounts',
  '/api/trips',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE && cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - different strategies for different resources
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Skip Next.js HMR and internal requests in development
  if (url.pathname.startsWith('/_next/webpack-hmr') || 
      url.pathname.startsWith('/_next/static/development')) {
    return;
  }

  // API routes - Stale While Revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Static assets and pages - Cache First, then Network
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages - Network First with cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, CACHE_NAME));
    return;
  }

  // Default - Network First
  event.respondWith(networkFirst(request, CACHE_NAME));
});

// ============ Caching Strategies ============

/**
 * Stale While Revalidate
 * Return cached response immediately, then update cache in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Start network fetch in background
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) {
        // Clone and cache the response
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.log('[SW] Network fetch failed:', error);
      return null;
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    console.log('[SW] Returning cached API response:', request.url);
    // Don't wait for network, just trigger background update
    networkFetch;
    return cachedResponse;
  }

  // No cache, wait for network
  const networkResponse = await networkFetch;
  if (networkResponse) {
    return networkResponse;
  }

  // Both failed, return error response
  return new Response(JSON.stringify({ error: 'Offline and no cached data' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Cache First
 * Check cache first, fall back to network
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache first failed:', error);
    return caches.match('/offline.html');
  }
}

/**
 * Network First
 * Try network first, fall back to cache
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network first failed, trying cache:', error);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline.html');
    }

    return new Response('Network error', { status: 503 });
  }
}

// ============ Helpers ============

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2')
  );
}

// ============ Background Sync ============

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

async function syncTransactions() {
  console.log('[SW] Syncing transactions...');
  
  // Notify all clients to sync
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_TRANSACTIONS' });
  });
}

// ============ Push Notifications ============

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from TravelAI',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification('TravelAI', options)
  );
});

// ============ Message Handler ============

self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
