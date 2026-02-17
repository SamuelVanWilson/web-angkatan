export async function initPanitiaPage() {
  const container = document.getElementById('panitia-container');
  const searchInput = document.getElementById('panitia-search');

  if (!container) return () => { }; // Return empty cleanup if failed

  let cleanupFns = [];

  // Fetch Data
  let panitiaData = [];
  try {
    const response = await fetch('/src/data/panitia.json');
    panitiaData = await response.json();
  } catch (error) {
    console.error("Failed to load panitia data", error);
    container.innerHTML = '<p class="text-center text-red-500">Gagal memuat data panitia.</p>';
    return () => { };
  }

  // Initial Render
  renderGroupedPanitia(panitiaData);

  // Search Logic
  if (searchInput) {
    const handleInput = (e) => {
      const keyword = e.target.value.toLowerCase();
      // Clear previous cleanups before re-rendering
      cleanupFns.forEach(fn => fn());
      cleanupFns = [];

      const filtered = panitiaData.filter(p =>
        p.name.toLowerCase().includes(keyword) ||
        p.division.toLowerCase().includes(keyword) ||
        p.role.toLowerCase().includes(keyword)
      );
      renderGroupedPanitia(filtered, keyword !== '');
    };
    searchInput.addEventListener('input', handleInput);
  }

  function renderGroupedPanitia(data, isSearching = false) {
    container.innerHTML = '';

    if (data.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-gray-500 text-lg">Tidak ada panitia yang ditemukan.</p>
        </div>
      `;
      return;
    }

    const divisionOrder = [
      "Badan Pengurus Harian",
      "Kreatif & Konsep",
      "Publikasi & Media",
      "Humas & Sponsorship",
      "Lapangan & Acara",
      "Sarana & Prasarana"
    ];

    const grouped = data.reduce((acc, item) => {
      const div = item.division;
      if (!acc[div]) acc[div] = [];
      acc[div].push(item);
      return acc;
    }, {});

    let divisionsToRender = isSearching
      ? Object.keys(grouped)
      : divisionOrder.filter(d => grouped[d]);

    divisionsToRender.forEach(divName => {
      const members = grouped[divName];
      if (!members) return;

      const section = document.createElement('div');
      section.className = 'mb-16';
      const cleanDivName = divName.replace(/\s+/g, '-').replace(/[^\w-]/g, '');

      // Header
      section.innerHTML = `
                <div class="flex items-center gap-4 mb-6 px-4 md:px-0">
                    <h2 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">${divName}</h2>
                    <div class="h-px bg-gray-200 flex-1"></div>
                    <span class="text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:inline-block">
                        ${members.length} Members
                    </span>
                </div>
            `;

      // Scroll Wrapper
      const scrollWrapper = document.createElement('div');
      scrollWrapper.className = 'relative group/scroll';

      scrollWrapper.innerHTML = `
                <!-- Indicators -->
                <div id="left-gradient-${cleanDivName}" class="opacity-0 transition-opacity duration-300 absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                <div id="right-gradient-${cleanDivName}" class="opacity-0 transition-opacity duration-300 absolute right-0 top-0 bottom-0 w-10 md:w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none flex items-center justify-end pr-2 md:pr-3">
                     <div class="text-gray-400 animate-pulse">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                     </div>
                </div>

                <!-- Scrollable Area -->
                <div id="scroll-container-${cleanDivName}" 
                     class="flex gap-6 overflow-x-auto pb-8 pt-4 px-4 md:px-0 scrollbar-hide scroll-smooth snap-x snap-mandatory"
                     style="overscroll-behavior-x: contain;">
                    <!-- Content -->
                    ${members.map(item => createCardHTML(item)).join('')}
                    <!-- Pad End -->
                    <div class="w-1 shrink-0"></div> 
                </div>
            `;

      section.appendChild(scrollWrapper);
      container.appendChild(section);

      // Initialize Logic
      requestAnimationFrame(() => {
        const scroller = document.getElementById(`scroll-container-${cleanDivName}`);
        const leftGrad = document.getElementById(`left-gradient-${cleanDivName}`);
        const rightGrad = document.getElementById(`right-gradient-${cleanDivName}`);

        if (scroller) {
          // Add small buffer to prevent fractional width issues
          const isOverflowing = scroller.scrollWidth > scroller.clientWidth + 2;

          if (isOverflowing) {
            rightGrad.classList.remove('opacity-0');

            let scrollSpeed = 0.5;
            let isHovering = false;
            let direction = 1;
            let animationId;
            let isAnimating = true;

            const onEnter = () => isHovering = true;
            const onLeave = () => isHovering = false;
            const onTouchStart = () => isHovering = true;
            const onTouchEnd = () => setTimeout(() => isHovering = false, 1000);

            scroller.addEventListener('mouseenter', onEnter);
            scroller.addEventListener('mouseleave', onLeave);
            scroller.addEventListener('touchstart', onTouchStart);
            scroller.addEventListener('touchend', onTouchEnd);

            function autoScroll() {
              if (!isAnimating) return;

              if (!isHovering && scroller && document.body.contains(scroller)) {
                // Determine direction based on position
                // Logic: Move towards end (1), if hit end, reverse (-1).

                // Adjust position
                scroller.scrollLeft += scrollSpeed * direction;

                // Check bounds for reversal
                if (direction === 1 && scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 1) {
                  direction = -1; // Reverse
                } else if (direction === -1 && scroller.scrollLeft <= 0) {
                  direction = 1; // Forward
                }
              }
              animationId = requestAnimationFrame(autoScroll);
            }

            // Start immediately
            animationId = requestAnimationFrame(autoScroll);

            // Scroll Indicators Logic
            const onScroll = () => {
              if (scroller.scrollLeft > 20) leftGrad.classList.remove('opacity-0');
              else leftGrad.classList.add('opacity-0');

              if (scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth - 20) rightGrad.classList.remove('opacity-0');
              else rightGrad.classList.add('opacity-0');
            };
            scroller.addEventListener('scroll', onScroll);

            // Cleanup for this item
            cleanupFns.push(() => {
              isAnimating = false;
              cancelAnimationFrame(animationId);
              scroller.removeEventListener('mouseenter', onEnter);
              scroller.removeEventListener('mouseleave', onLeave);
              scroller.removeEventListener('touchstart', onTouchStart);
              scroller.removeEventListener('touchend', onTouchEnd);
              scroller.removeEventListener('scroll', onScroll);
            });

          } else {
            scroller.classList.add('justify-center');
          }
        }
      });
    });
  }

  function createCardHTML(item) {
    const initials = item.name.substring(0, 2).toUpperCase();
    const instagramHandle = item.instagram ? item.instagram.replace('@', '') : '';
    return `
            <div class="shrink-0 w-[280px] snap-center group relative bg-white rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-2">
                <div class="aspect-square bg-gray-100 relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-tr from-gray-100 to-gray-50 flex items-center justify-center text-4xl font-bold text-gray-300 group-hover:scale-110 transition-transform duration-500">
                        ${initials}
                    </div>
                     <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <a href="https://instagram.com/${instagramHandle}" target="_blank" class="bg-white text-black px-6 py-2 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-gray-200">
                            Visit
                        </a>
                     </div>
                </div>
                <div class="p-6 relative">
                    <h3 class="text-xl font-bold mb-1 text-gray-900 truncate">${item.name}</h3>
                    <p class="text-sm text-gray-500 font-medium">${item.role}</p>
                    <p class="text-xs text-gray-400 mt-3 py-1 px-2 bg-gray-50 rounded-lg inline-block border border-gray-100">${item.class}</p>
                    
                    ${instagramHandle ? `
                    <a href="https://instagram.com/${instagramHandle}" target="_blank" 
                       class="absolute bottom-5 right-5 text-gray-400 hover:text-pink-500 transition-colors duration-200" 
                       title="@${instagramHandle}">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd" />
                        </svg>
                    </a>
                    ` : ''}
                </div>
            </div>
        `;
  }

  // Return global cleanup
  return () => {
    cleanupFns.forEach(fn => fn());
  };
}
