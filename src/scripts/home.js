import { resolvePath } from '../utils.js';

// Navbar Logic (Shared)
export function initNavbar() {
    const navbar = document.getElementById('landing-navbar');
    const scrollThreshold = window.innerHeight - 100;

    function handleScroll() {
        if (!navbar) return;

        // Check if we are on index page (has hero slider) or inner page
        const hasHero = document.getElementById('hero-slider');

        // If has hero, use threshold. If no hero (some inner pages might differ), maybe show immediately?
        // User requested: "navbar nya jangan keliatan pas user/client masih di section hero".
        // This implies we should always use the scroll logic if there's a large top section.
        // For consistency, let's use the same logic everywhere for now.

        if (window.scrollY > 200) { // Reduced threshold to 200px for better UX on all pages
            navbar.classList.remove('-translate-y-[200%]', 'opacity-0');
            navbar.classList.add('translate-y-0', 'opacity-100');
        } else {
            navbar.classList.remove('translate-y-0', 'opacity-100');
            navbar.classList.add('-translate-y-[200%]', 'opacity-0');
        }
    }

    window.addEventListener('scroll', handleScroll);

    // Mobile Menu Logic
    // We attach listener to document to handle dynamic content, but we need to be careful not to duplicate
    // if this function is called multiple times.
    // Better to attach to the specific element if possible, or use a global handler.

    // Let's remove any existing handler first? No easy way.
    // Instead, let's stick to the router.js calling this once per page load.
    // We'll use a named function for the click handler to allow removal if needed, 
    // but for now simple checks are fine.

    // Ensure we don't hold onto old references
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
}


// Index Page Carousel Logic
export function initHeroCarousel() {
    const intervals = [];

    // --- Hero Slider ---
    const heroSlides = document.querySelectorAll('.hero-slide');
    if (heroSlides.length > 0) {
        let heroCurrent = 0;
        const heroInterval = setInterval(() => {
            heroCurrent = (heroCurrent + 1) % heroSlides.length;
            updateSlides(heroSlides, heroCurrent);
        }, 4000); // Diperlambat menjadi 4 detik
        intervals.push(heroInterval);
    }

    // --- Explore Sliders ---
    const exploreSliders = document.querySelectorAll('.explore-slider');
    exploreSliders.forEach(slider => {
        const slides = slider.querySelectorAll('.explore-slide');
        if (slides.length === 0) return;

        const intervalTime = parseInt(slider.dataset.interval) || 3000;
        let current = 0;

        const sliderInterval = setInterval(() => {
            current = (current + 1) % slides.length;
            updateSlides(slides, current);
        }, intervalTime);

        intervals.push(sliderInterval);
    });

    return () => {
        intervals.forEach(id => clearInterval(id));
    };
}

// Helper
function updateSlides(nodeList, activeIndex) {
    nodeList.forEach((slide, i) => {
        if (i === activeIndex) {
            slide.classList.remove('opacity-0');
            slide.classList.add('opacity-100');
        } else {
            slide.classList.remove('opacity-100');
            slide.classList.add('opacity-0');
        }
    });
}

// Global Click Listener for Menu (Running once, outside init)
// This avoids duplicate listeners on page navigation
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#landing-menu-btn');
    if (btn) {
        const menu = document.getElementById('landing-mobile-menu');
        if (!menu) return;

        const isClosed = menu.classList.contains('opacity-0');

        if (isClosed) {
            // OPEN
            menu.classList.remove('opacity-0', 'scale-95', 'pointer-events-none', '-translate-y-2');
            menu.classList.add('opacity-100', 'scale-100', 'pointer-events-auto', 'translate-y-0');
        } else {
            // CLOSE
            menu.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto', 'translate-y-0');
            menu.classList.add('opacity-0', 'scale-95', 'pointer-events-none', '-translate-y-2');
        }
    }
});

// --- Year Selection Modal Logic (Global) ---
let yearModalState = {
    isOpen: false,
    dataLoaded: false
};

function openYearModal() {
    const modal = document.getElementById('year-modal');
    const backdrop = document.getElementById('year-modal-backdrop');
    const content = document.getElementById('year-modal-content');
    const container = document.getElementById('year-options-container');

    if (!modal || yearModalState.isOpen) return;

    modal.classList.remove('hidden');
    void modal.offsetWidth; // Trigger reflow

    backdrop?.classList.remove('opacity-0');
    content?.classList.remove('scale-95', 'opacity-0');
    content?.classList.add('scale-100', 'opacity-100');

    yearModalState.isOpen = true;

    // Load Data if not already loaded
    if (!yearModalState.dataLoaded && container) {
        fetch(resolvePath('/data/taruna.json'))
            .then(res => res.json())
            .then(data => {
                renderYearOptions(data, container);
                yearModalState.dataLoaded = true;
            })
            .catch(err => {
                console.error(err);
                container.innerHTML = '<p class="text-red-500 text-center">Gagal memuat data.</p>';
            });
    }
}

function closeYearModal() {
    const modal = document.getElementById('year-modal');
    const backdrop = document.getElementById('year-modal-backdrop');
    const content = document.getElementById('year-modal-content');

    if (!modal || !yearModalState.isOpen) return;

    backdrop?.classList.add('opacity-0');
    content?.classList.remove('scale-100', 'opacity-100');
    content?.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
        yearModalState.isOpen = false;
    }, 300);
}

function renderYearOptions(years, container) {
    container.innerHTML = '';
    years.forEach(year => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left px-5 py-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all group flex items-center justify-between';
        btn.innerHTML = `
          <span class="font-semibold text-gray-700 group-hover:text-black">${year.yearLabel}</span>
          <svg class="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        `;
        btn.onclick = () => {
            window.location.href = `/taruna?year=${year.id}`;
        };
        container.appendChild(btn);
    });
}

// Global Click Listener for Taruna Links
document.addEventListener('click', (e) => {
    const tarunaLink = e.target.closest('a[href="/taruna"]');
    if (tarunaLink) {
        e.preventDefault();
        openYearModal();
    }

    // Close year modal when clicking close button or backdrop
    const closeBtn = e.target.closest('#close-year-modal');
    const backdrop = e.target.closest('#year-modal-backdrop');
    if (closeBtn || backdrop) {
        closeYearModal();
    }
});

// Esc key to close year modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && yearModalState.isOpen) {
        closeYearModal();
    }
});

// --- Class Selection Modal Logic (Global) ---
let classModalState = {
    isOpen: false,
    dataLoaded: false,
    allData: [] // Store data for search filtering
};

function openClassModal() {
    const modal = document.getElementById('class-modal');
    const backdrop = document.getElementById('class-modal-backdrop');
    const content = document.getElementById('class-modal-content');
    const container = document.getElementById('class-options-container');
    const searchInput = document.getElementById('class-search-input');

    if (!modal || classModalState.isOpen) return;

    modal.classList.remove('hidden');
    void modal.offsetWidth; // Trigger reflow

    backdrop?.classList.remove('opacity-0');
    content?.classList.remove('scale-95', 'opacity-0');
    content?.classList.add('scale-100', 'opacity-100');

    classModalState.isOpen = true;

    // Clear search input on open
    if (searchInput) {
        searchInput.value = '';
    }

    // Load Data if not already loaded
    if (!classModalState.dataLoaded && container) {
        fetch(resolvePath('/data/kelas.json'))
            .then(res => res.json())
            .then(data => {
                classModalState.allData = data;
                renderClassOptions(data, container);
                classModalState.dataLoaded = true;
            })
            .catch(err => {
                console.error(err);
                container.innerHTML = '<p class="text-red-500 text-center col-span-full">Gagal memuat data.</p>';
            });
    } else if (classModalState.dataLoaded && container) {
        // Re-render all data (in case search was active before)
        renderClassOptions(classModalState.allData, container);
    }
}

function closeClassModal() {
    const modal = document.getElementById('class-modal');
    const backdrop = document.getElementById('class-modal-backdrop');
    const content = document.getElementById('class-modal-content');

    if (!modal || !classModalState.isOpen) return;

    backdrop?.classList.add('opacity-0');
    content?.classList.remove('scale-100', 'opacity-100');
    content?.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
        classModalState.isOpen = false;
    }, 300);
}

function renderClassOptions(classes, container) {
    const noResultsEl = document.getElementById('class-no-results');

    container.innerHTML = '';

    if (classes.length === 0) {
        noResultsEl?.classList.remove('hidden');
        return;
    }

    noResultsEl?.classList.add('hidden');

    classes.forEach(cls => {
        const btn = document.createElement('button');
        btn.className = 'text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all group flex flex-col';
        btn.innerHTML = `
          <span class="font-semibold text-gray-700 group-hover:text-black text-sm">${cls.label}</span>
          <span class="text-xs text-gray-400">${cls.jurusan}</span>
        `;
        btn.onclick = () => {
            window.location.href = `/kelas?class=${cls.id}`;
        };
        container.appendChild(btn);
    });
}

function filterClasses(keyword) {
    const container = document.getElementById('class-options-container');
    if (!container || !classModalState.allData.length) return;

    const filtered = classModalState.allData.filter(cls =>
        cls.label.toLowerCase().includes(keyword.toLowerCase()) ||
        cls.jurusan.toLowerCase().includes(keyword.toLowerCase())
    );

    renderClassOptions(filtered, container);
}

// Global Click Listener for Kelas Links
document.addEventListener('click', (e) => {
    const kelasLink = e.target.closest('a[href="/kelas"]');
    if (kelasLink) {
        e.preventDefault();
        openClassModal();
    }

    // Close class modal when clicking close button or backdrop
    const closeBtn = e.target.closest('#close-class-modal');
    const backdrop = e.target.closest('#class-modal-backdrop');
    if (closeBtn || backdrop) {
        closeClassModal();
    }
});

// Search Input Listener
document.addEventListener('input', (e) => {
    if (e.target.id === 'class-search-input') {
        filterClasses(e.target.value);
    }
});

// Esc key to close class modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && classModalState.isOpen) {
        closeClassModal();
    }
});
