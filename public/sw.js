// ============================================
// Service Worker - KILL SWITCH
// Menghapus dirinya sendiri dan semua cache
// agar user selalu mendapat versi website terbaru
// ============================================

self.addEventListener('install', () => {
    // Memaksa SW baru segera terinstall tanpa menunggu
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Hapus SEMUA cache di browser user
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    console.log('[SW Kill Switch] Deleting cache:', name);
                    return caches.delete(name);
                })
            );
        }).then(() => {
            // Unregister dirinya sendiri
            self.registration.unregister();
            console.log('[SW Kill Switch] Service Worker destroyed.');
        })
    );
});
