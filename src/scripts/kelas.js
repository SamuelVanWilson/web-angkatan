export async function initKelasPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const classId = urlParams.get('class');

  const contentContainer = document.getElementById('kelas-content');

  if (!classId) {
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Kelas belum dipilih</h2>
          <p class="text-gray-500 mb-6">Silakan pilih kelas terlebih dahulu</p>
          <a href="/" class="px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors">Kembali ke Beranda</a>
        </div>
      `;
    }
    return;
  }

  try {
    const response = await fetch('/data/kelas.json');
    const allData = await response.json();
    const data = allData.find(item => item.id === classId);

    if (!data) {
      if (contentContainer) {
        contentContainer.innerHTML = `
          <div class="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
            <h2 class="text-2xl font-bold mb-4 text-gray-900">Data kelas tidak ditemukan</h2>
            <a href="/" class="px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors">Kembali ke Beranda</a>
          </div>
        `;
      }
      return;
    }

    renderPage(data);

  } catch (error) {
    console.error("Failed to load kelas data", error);
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="min-h-[50vh] flex flex-col items-center justify-center text-red-500">
          <p>Terjadi kesalahan saat memuat data.</p>
        </div>
      `;
    }
  }
}

function renderPage(data) {
  // Update Title
  const titleEl = document.getElementById('kelas-title');
  if (titleEl) titleEl.textContent = data.label;

  // Update Subtitle (Jurusan)
  const subtitleEl = document.getElementById('kelas-subtitle');
  if (subtitleEl) subtitleEl.textContent = data.jurusan;

  // Update Yearbook Button Link
  const yearbookBtn = document.getElementById('btn-lihat-yearbook');
  if (yearbookBtn) {
    yearbookBtn.href = `/yearbook?class=${data.id}`;
  }

  // Render Class Moments (Horizontal Scroll Cards)
  const momentsContainer = document.getElementById('class-moments-container');
  if (momentsContainer && data.classMoments) {
    momentsContainer.innerHTML = data.classMoments.map((item, index) => `
          <div class="shrink-0 w-[280px] md:w-[320px] aspect-[3/4] bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 hover:bg-gray-200 transition-colors cursor-pointer overflow-hidden group snap-center relative" data-lightbox-src="${item.image || ''}">
            ${item.image ? `
              <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              <!-- Click Indicator -->
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-md rounded-full p-3">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                  </svg>
                </div>
              </div>
            ` : `
              <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
            `}
          </div>
        `).join('') + '<div class="w-1 shrink-0"></div>'; // End padding

    // Add click handlers for lightbox
    momentsContainer.querySelectorAll('[data-lightbox-src]').forEach(el => {
      const src = el.dataset.lightboxSrc;
      if (src) {
        el.addEventListener('click', () => openLightbox(src, true));
      }
    });

    // Initialize scroll indicators
    initScrollIndicators();
  }

  // Render Last Photograph
  const lastPhotoContainer = document.getElementById('last-photo-container');
  if (lastPhotoContainer) {
    if (data.lastPhotograph) {
      lastPhotoContainer.innerHTML = `
              <img src="${data.lastPhotograph}" alt="The Last Photograph" class="w-full h-full object-cover cursor-pointer hover:brightness-90 transition-all duration-300" data-lightbox-src="${data.lastPhotograph}">
            `;
      // Add click handler
      lastPhotoContainer.querySelector('[data-lightbox-src]').addEventListener('click', () => openLightbox(data.lastPhotograph, false));
    } else {
      lastPhotoContainer.innerHTML = `
              <svg class="w-16 h-16 md:w-24 md:h-24 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
            `;
    }
  }
}

// Lightbox functions
function openLightbox(src, isMoment = false) {
  const lightbox = document.getElementById('photo-lightbox');
  const lightboxImage = document.getElementById('lightbox-image');

  if (lightbox && lightboxImage && src) {
    lightboxImage.src = src;

    if (isMoment) {
      lightboxImage.classList.add('aspect-[3/4]', 'object-cover', 'w-full', 'md:w-auto', 'md:h-full');
      lightboxImage.classList.remove('object-contain');
    } else {
      lightboxImage.classList.remove('aspect-[3/4]', 'object-cover', 'w-full', 'md:w-auto', 'md:h-full');
      lightboxImage.classList.add('object-contain');
    }

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

function initScrollIndicators() {
  const scroller = document.getElementById('class-moments-container');
  const leftGrad = document.getElementById('moments-left-gradient');
  const rightGrad = document.getElementById('moments-right-gradient');

  if (!scroller || !leftGrad || !rightGrad) return;

  const updateIndicators = () => {
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
