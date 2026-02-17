export async function initTarunaPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const yearId = urlParams.get('year');

  if (!yearId) {
    document.getElementById('content-container').innerHTML = `
      <div class="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
        <h2 class="text-xl md:text-2xl font-bold mb-4 text-gray-900">Tahun tidak dipilih</h2>
        <p class="text-gray-500 mb-6">Silakan pilih tahun terlebih dahulu</p>
        <a href="/" class="px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors">Kembali ke Beranda</a>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch('/src/data/taruna.json');
    const allData = await response.json();
    const data = allData.find(item => item.id === yearId);

    if (!data) {
      document.getElementById('content-container').innerHTML = `
        <div class="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
          <h2 class="text-xl md:text-2xl font-bold mb-4 text-gray-900">Data tahun tidak ditemukan</h2>
          <a href="/" class="px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors">Kembali ke Beranda</a>
        </div>
      `;
      return;
    }

    renderPage(data);

  } catch (error) {
    console.error("Failed to load data", error);
    const container = document.getElementById('content-container');
    if (container) {
      container.innerHTML = `
        <div class="min-h-[50vh] flex flex-col items-center justify-center text-red-500 px-4">
            <p>Terjadi kesalahan saat memuat data.</p>
        </div>
        `;
    }
  }
}

function renderPage(data) {
  // Update Title
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = `TARUNA ${data.yearLabel.toUpperCase()}`;

  // Render Highlights (Horizontal Scroll Cards)
  const highlightsContainer = document.getElementById('highlights-container');
  if (highlightsContainer && data.highlights) {
    highlightsContainer.innerHTML = data.highlights.map((item, index) => `
      <div class="shrink-0 w-[280px] md:w-[320px] aspect-square bg-gray-100 rounded-xl overflow-hidden group snap-center relative cursor-pointer" data-lightbox-src="${item.image || ''}">
        ${item.image ? `
          <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        ` : `
          <div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
            <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
        `}
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        <!-- Click Indicator -->
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-md rounded-full p-3">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
            </svg>
          </div>
        </div>
        <div class="absolute bottom-0 left-0 p-4 md:p-6">
          <span class="text-white/60 text-xs font-bold tracking-widest uppercase mb-1 block">Highlight 0${index + 1}</span>
          <h3 class="text-lg md:text-xl font-bold text-white">${item.title}</h3>
        </div>
      </div>
    `).join('') + '<div class="w-1 shrink-0"></div>';

    // Add click handlers for lightbox
    highlightsContainer.querySelectorAll('[data-lightbox-src]').forEach(el => {
      const src = el.dataset.lightboxSrc;
      if (src) {
        el.addEventListener('click', () => openLightbox(src));
      }
    });

    // Initialize scroll indicators and auto-slide
    initScrollSection('highlights-container', 'highlights-left-gradient', 'highlights-right-gradient');
  }

  // Render Kompi List - Mobile (Horizontal Scroll) and Desktop (Bento Grid)
  const kompiContainerMobile = document.getElementById('kompi-container-mobile');
  const kompiContainerDesktop = document.getElementById('kompi-container-desktop');

  if (data.kompi) {
    // Mobile: Horizontal scroll cards
    if (kompiContainerMobile) {
      kompiContainerMobile.innerHTML = data.kompi.map((kompi, index) => `
        <div class="shrink-0 w-[260px] h-[320px] bg-gray-900 rounded-xl overflow-hidden group snap-center relative ring-1 ring-white/10 hover:ring-white/20 transition-all cursor-pointer" data-lightbox-src="${kompi.image || ''}">
          ${kompi.image ? `
            <img src="${kompi.image}" alt="${kompi.name}" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500">
          ` : `
            <div class="absolute inset-0 bg-gray-800"></div>
          `}
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
          
          <div class="absolute inset-0 p-4 flex flex-col justify-end">
            <div class="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
              <p class="text-blue-400 text-xs font-bold tracking-widest uppercase mb-1">${kompi.description || 'Division'}</p>
              <h3 class="text-xl font-bold text-white mb-2 tracking-tight">${kompi.name}</h3>
              
              <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-2 text-sm text-gray-300">
                <span>View Details</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          </div>
        </div>
      `).join('') + '<div class="w-1 shrink-0"></div>';

      // Add click handlers for lightbox on mobile kompi cards
      kompiContainerMobile.querySelectorAll('[data-lightbox-src]').forEach(el => {
        const src = el.dataset.lightboxSrc;
        if (src) {
          el.addEventListener('click', () => openLightbox(src));
        }
      });

      // Initialize scroll indicators for mobile
      initScrollSection('kompi-container-mobile', 'kompi-left-gradient', 'kompi-right-gradient');
    }

    // Desktop: Bento grid layout
    if (kompiContainerDesktop) {
      if (data.kompi.length >= 5) {
        // Helper to create card
        const createCard = (kompi, className = "") => `
          <div class="${className} bg-gray-900 rounded-2xl overflow-hidden group relative ring-1 ring-white/10 hover:ring-white/20 transition-all cursor-pointer" data-lightbox-src="${kompi.image || ''}">
            ${kompi.image ? `<img src="${kompi.image}" alt="${kompi.name}" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500">` : `<div class="absolute inset-0 bg-gray-800"></div>`}
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
            <div class="absolute inset-0 p-6 flex flex-col justify-end">
              <div class="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <p class="text-blue-400 text-xs font-bold tracking-widest uppercase mb-1">${kompi.description || 'Division'}</p>
                <h3 class="text-2xl font-bold text-white mb-2 tracking-tight">${kompi.name}</h3>
                <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-2 text-sm text-gray-300">
                  <span>View →</span>
                </div>
              </div>
            </div>
          </div>`;

        const [kA, kB, kC, kD, kE] = data.kompi;

        kompiContainerDesktop.innerHTML = `
          <!-- Left Column -->
          <div class="flex flex-col gap-4 lg:gap-6">
             <!-- Kompi A (Top Large) -->
             ${createCard(kA, "flex-grow min-h-[400px]")}
             <!-- Nested Grid for Kompi B & C (Bottom Row) -->
             <div class="grid grid-cols-2 gap-4 lg:gap-6 h-[250px]">
                ${createCard(kB, "h-full")}
                ${createCard(kC, "h-full")}
             </div>
          </div>
          <!-- Right Column -->
          <div class="flex flex-col gap-4 lg:gap-6">
             <!-- Kompi D (Top Landscape) -->
             ${createCard(kD, "h-[250px]")}
             <!-- Kompi E (Bottom Large) -->
             ${createCard(kE, "flex-grow min-h-[400px]")}
          </div>
        `;
      } else {
        kompiContainerDesktop.innerHTML = `<p class="text-white text-center col-span-2">Data kompi tidak cukup.</p>`;
      }

      // Add click handlers for lightbox on desktop kompi cards
      kompiContainerDesktop.querySelectorAll('[data-lightbox-src]').forEach(el => {
        const src = el.dataset.lightboxSrc;
        if (src) {
          el.addEventListener('click', () => openLightbox(src));
        }
      });
    }
  }
}

function initScrollSection(scrollerId, leftGradId, rightGradId) {
  const scroller = document.getElementById(scrollerId);
  const leftGrad = document.getElementById(leftGradId);
  const rightGrad = document.getElementById(rightGradId);

  if (!scroller) return;

  const updateIndicators = () => {
    if (!leftGrad || !rightGrad) return;

    // Show left gradient if scrolled
    if (scroller.scrollLeft > 20) {
      leftGrad.classList.remove('opacity-0');
    } else {
      leftGrad.classList.add('opacity-0');
    }

    // Hide right gradient if at end
    if (scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth - 20) {
      rightGrad.classList.remove('opacity-0');
    } else {
      rightGrad.classList.add('opacity-0');
    }
  };

  // Initial check
  updateIndicators();

  // Listen to scroll
  scroller.addEventListener('scroll', updateIndicators);

  // Auto-slide functionality
  initAutoSlide(scroller);
}

function initAutoSlide(scroller) {
  if (!scroller) return;

  let isHovering = false;
  let direction = 1; // 1 = forward, -1 = backward (ping-pong)
  const slideInterval = 2000; // 2 seconds
  const cardWidth = 280 + 16; // Card width + gap (approximate)

  setInterval(() => {
    if (isHovering) return;

    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    const currentScroll = scroller.scrollLeft;

    // Check boundaries and reverse direction
    if (direction === 1 && currentScroll >= maxScroll - 5) {
      direction = -1; // At end, go backward
    } else if (direction === -1 && currentScroll <= 5) {
      direction = 1; // At start, go forward
    }

    // Scroll in current direction
    scroller.scrollBy({ left: cardWidth * direction, behavior: 'smooth' });
  }, slideInterval);

  // Pause on hover/touch
  scroller.addEventListener('mouseenter', () => { isHovering = true; });
  scroller.addEventListener('mouseleave', () => { isHovering = false; });
  scroller.addEventListener('touchstart', () => { isHovering = true; });
  scroller.addEventListener('touchend', () => {
    setTimeout(() => { isHovering = false; }, 1000);
  });
}

// Lightbox functions
function openLightbox(src) {
  const lightbox = document.getElementById('photo-lightbox');
  const lightboxImage = document.getElementById('lightbox-image');

  if (lightbox && lightboxImage && src) {
    lightboxImage.src = src;
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('photo-lightbox');
  if (lightbox) {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// Initialize lightbox close handlers
function initLightbox() {
  const closeBtn = document.getElementById('close-lightbox');
  const lightbox = document.getElementById('photo-lightbox');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.id === 'lightbox-image') {
        closeLightbox();
      }
    });
  }

  // ESC key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

// Call initLightbox when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLightbox);
} else {
  initLightbox();
}
