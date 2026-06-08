import { initRouter } from './router.js';

// Initialize the router when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initRouter();
});

// ---- Register Service Worker (PWA Cache) ----
// Hanya aktif di PRODUCTION (setelah npm run build & hosting)
// Saat development (npm run dev), cache TIDAK aktif
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.log('[PWA] Service Worker registered with scope:', registration.scope);

                // Check for updates periodically (every 1 hour)
                setInterval(() => {
                    registration.update();
                    console.log('[PWA] Checking for Service Worker updates...');
                }, 60 * 60 * 1000);
            })
            .catch((error) => {
                console.error('[PWA] Service Worker registration failed:', error);
            });
    });
} else if (import.meta.env.DEV) {
    console.log('[PWA] Service Worker disabled in development mode.');
}

