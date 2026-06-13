import Navigo from 'navigo';
import { resolvePath, fixAssetPaths } from './utils.js';
import { initHeroCarousel, initNavbar } from './scripts/home.js';
import { initPanitiaPage } from './scripts/panitia.js';
import { initKelasPage } from './scripts/kelas.js';
import { initYearbook } from './scripts/yearbook.js';

let router;
let appContainer;
let pageCleanup = null;
let navbarCleanup = null;

async function loadPage(pageName) {
    try {
        const response = await fetch(resolvePath(`/pages/${pageName}.html`));
        if (!response.ok) throw new Error(`Failed to load ${pageName}`);

        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const bodyContent = doc.body.innerHTML;

        // Update the container with the new content
        appContainer.innerHTML = bodyContent;
        fixAssetPaths(appContainer);

        // Cleanup previous cleanups
        if (pageCleanup) {
            pageCleanup();
            pageCleanup = null;
        }
        if (navbarCleanup) {
            navbarCleanup();
            navbarCleanup = null;
        }

        // Initialize Navbar (Shared)
        navbarCleanup = initNavbar();

        // Initialize page specific logic
        if (pageName === 'index') {
            pageCleanup = initHeroCarousel();
        } else if (pageName === 'panitia') {
            pageCleanup = await initPanitiaPage();
        } else if (pageName === 'kelas') {
            await initKelasPage();
        } else if (pageName === 'yearbook') {
            await initYearbook();
        }

        // Scroll to top
        window.scrollTo(0, 0);
    } catch (error) {
        console.error('Error loading page:', error);
        appContainer.innerHTML = '<div class="text-center py-20"><h1 class="text-4xl font-bold">404 - Page Not Found</h1></div>';
    }
}

// Function to initialize navbar interactions (mobile menu, scroll effects)
function initializeNavbarInteractions() {
    // Mobile menu toggle
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');

    if (btn && menu) {
        btn.addEventListener('click', () => {
            menu.classList.toggle('hidden');
            const expanded = btn.getAttribute('aria-expanded') === 'true' || false;
            btn.setAttribute('aria-expanded', !expanded);
        });
    }

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                navbar.classList.add('shadow-sm');
                navbar.classList.remove('bg-white/80', 'backdrop-blur-md');
                navbar.classList.add('bg-white', 'backdrop-blur-none');
            } else {
                navbar.classList.remove('shadow-sm', 'bg-white', 'backdrop-blur-none');
                navbar.classList.add('bg-white/80', 'backdrop-blur-md');
            }
        };

        // Remove any existing scroll listeners to avoid duplicates
        window.removeEventListener('scroll', handleScroll);
        window.addEventListener('scroll', handleScroll);
    }
}

// Initialize router
export function initRouter() {
    // Get the app container
    appContainer = document.getElementById('app');

    if (!appContainer) {
        console.error('App container not found!');
        return;
    }

    // Initialize the router
    router = new Navigo(import.meta.env.BASE_URL, { hash: false });

    // Define routes
    router
        .on('/', () => loadPage('index'))
        .on('/kelas', () => loadPage('kelas'))
        .on('/panitia', () => loadPage('panitia'))
        .on('/yearbook', () => loadPage('yearbook'))
        .notFound(() => {
            appContainer.innerHTML = '<div class="text-center py-20"><h1 class="text-4xl font-bold">404 - Page Not Found</h1></div>';
        });

    // Resolve the current route
    router.resolve();
}

// Export router for use in navigation
export default router;
