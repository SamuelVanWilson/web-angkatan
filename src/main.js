import { initRouter } from './router.js';

// Initialize the router when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initRouter();
});

// ---- Clear Service Worker (PWA Cache) ----
// Menghapus cache agar semua user langsung mendapatkan update terbaru
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (let registration of registrations) {
                registration.unregister();
                console.log('[PWA] Service Worker unregistered.');
            }
        });
        
        // Hapus semua storage cache di browser user
        if ('caches' in window) {
            caches.keys().then(keys => {
                keys.forEach(key => {
                    caches.delete(key);
                    console.log('[PWA] Deleted cache:', key);
                });
            });
        }
    });
}

