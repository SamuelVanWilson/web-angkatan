// ============================================
// Service Worker - ANTASERIN Yearbook PWA
// Strategi: Cache-First untuk gambar/aset,
//           Network-First untuk halaman HTML & data JSON
// ============================================

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `antaserin-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `antaserin-images-${CACHE_VERSION}`;
const DATA_CACHE = `antaserin-data-${CACHE_VERSION}`;

// Aset statis yang akan di-cache saat install
const PRECACHE_ASSETS = [
    '/',
    '/src/components/style.css',
    '/src/main.js',
    '/src/router.js',
    '/src/assets/logo.webp'
];

// ---- INSTALL: Pre-cache aset statis ----
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Pre-caching static assets');
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    // Langsung aktifkan tanpa menunggu SW lama selesai
    self.skipWaiting();
});

// ---- ACTIVATE: Hapus cache versi lama ----
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => {
                        // Hapus cache yang bukan versi saat ini
                        return (
                            name.startsWith('antaserin-') &&
                            name !== STATIC_CACHE &&
                            name !== IMAGE_CACHE &&
                            name !== DATA_CACHE
                        );
                    })
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    // Ambil alih semua tab yang terbuka
    self.clients.claim();
});

// ---- FETCH: Strategi caching berdasarkan tipe request ----
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Abaikan request non-GET (POST, PUT, dll)
    if (event.request.method !== 'GET') return;

    // Abaikan request ke external API / CDN yang bukan gambar
    if (url.origin !== self.location.origin && !isImageRequest(event.request)) {
        return;
    }

    // --- STRATEGI 1: Cache-First untuk GAMBAR ---
    // Gambar yearbook sangat besar, jadi kita simpan di cache dan ambil dari sana dulu
    if (isImageRequest(event.request)) {
        event.respondWith(cacheFirstStrategy(event.request, IMAGE_CACHE));
        return;
    }

    // --- STRATEGI 2: Network-First untuk DATA JSON ---
    // Data JSON perlu selalu fresh, tapi ada fallback cache jika offline
    if (isDataRequest(event.request)) {
        event.respondWith(networkFirstStrategy(event.request, DATA_CACHE));
        return;
    }

    // --- STRATEGI 3: Stale-While-Revalidate untuk ASET STATIS (JS, CSS, HTML) ---
    // Tampilkan dari cache dulu (cepat), lalu update cache di background
    event.respondWith(staleWhileRevalidate(event.request, STATIC_CACHE));
});

// ============================================
// HELPER: Deteksi tipe request
// ============================================

function isImageRequest(request) {
    const url = new URL(request.url);
    return (
        url.pathname.match(/\.(webp|png|jpe?g|gif|svg|ico|avif)$/i) ||
        url.hostname.includes('unsplash.com') ||
        url.hostname.includes('images.unsplash.com')
    );
}

function isDataRequest(request) {
    const url = new URL(request.url);
    return url.pathname.match(/\.(json)$/i);
}

// ============================================
// STRATEGI CACHING
// ============================================

// 1. Cache-First: Ambil dari cache dulu, kalau tidak ada baru dari network
//    Cocok untuk gambar yang jarang berubah
async function cacheFirstStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        // Ada di cache, langsung kembalikan (SUPER CEPAT)
        return cachedResponse;
    }

    // Tidak ada di cache, ambil dari network dan simpan
    try {
        const networkResponse = await fetch(request);
        // Hanya cache response yang sukses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.warn('[SW] Fetch failed for image:', request.url);
        // Return placeholder jika offline dan tidak ada cache
        return new Response('', { status: 404, statusText: 'Not Found' });
    }
}

// 2. Network-First: Coba dari network dulu, kalau gagal ambil dari cache
//    Cocok untuk data JSON yang perlu selalu fresh
async function networkFirstStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Update cache dengan data terbaru
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Offline — coba ambil dari cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            console.log('[SW] Serving data from cache (offline):', request.url);
            return cachedResponse;
        }
        return new Response('{}', {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 3. Stale-While-Revalidate: Kembalikan dari cache (cepat), update cache di background
//    Cocok untuk aset statis (JS, CSS) yang kadang berubah
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    // Fetch di background untuk update cache
    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch(() => {
            // Gagal fetch, tidak apa-apa, kita sudah punya cache
        });

    // Kembalikan cache langsung jika ada, kalau tidak tunggu network
    return cachedResponse || fetchPromise;
}
