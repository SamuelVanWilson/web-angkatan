/**
 * Base URL utility for deployment path handling.
 * 
 * Vite's import.meta.env.BASE_URL automatically reflects the `base` config
 * in vite.config.js. When deploying to GitHub Pages sub-path (/web-angkatan/),
 * BASE_URL = '/web-angkatan/'. When using a custom domain at root, BASE_URL = '/'.
 * 
 * This makes all paths work correctly in both environments without code changes.
 */

// The base URL from Vite (e.g., '/web-angkatan/' or '/')
const BASE = import.meta.env.BASE_URL;

/**
 * Resolves an absolute path to include the base URL.
 * Examples (when base = '/web-angkatan/'):
 *   resolvePath('/data/kelas.json')  → '/web-angkatan/data/kelas.json'
 *   resolvePath('/assets/logo.webp') → '/web-angkatan/assets/logo.webp'
 * 
 * When base = '/' (custom domain):
 *   resolvePath('/data/kelas.json')  → '/data/kelas.json' (unchanged)
 */
export function resolvePath(path) {
    if (!path) return path;
    if (path.startsWith('/')) {
        return BASE + path.slice(1);
    }
    return BASE + path;
}

/**
 * Fixes all asset paths in a DOM container.
 * Called after injecting HTML via innerHTML to fix paths in
 * <img src>, <source src>, and background-image styles.
 */
export function fixAssetPaths(container) {
    // Skip if base is root (no fixing needed)
    if (BASE === '/') return;

    // Fix <img src="/assets/...">
    container.querySelectorAll('img[src^="/assets/"], img[src^="/data/"]').forEach(img => {
        img.src = resolvePath(img.getAttribute('src'));
    });

    // Fix <source src="/assets/...">
    container.querySelectorAll('source[src^="/assets/"]').forEach(source => {
        source.src = resolvePath(source.getAttribute('src'));
    });

    // Fix inline background-image styles with url('/assets/...')
    container.querySelectorAll('[style*="/assets/"]').forEach(el => {
        el.style.cssText = el.style.cssText.replace(
            /url\(['"]?\/(assets\/[^'")\s]+)['"]?\)/g,
            (match, p1) => `url('${BASE}${p1}')`
        );
    });

    // Fix <a href="/..."> navigation links
    container.querySelectorAll('a[href^="/"]').forEach(a => {
        const href = a.getAttribute('href');
        // Don't fix external links or already-prefixed links
        if (!href.startsWith('//') && !href.startsWith(BASE)) {
            a.setAttribute('href', resolvePath(href));
        }
    });
}
