export async function initGuruPage() {
  const container = document.getElementById('guru-container');
  const searchInput = document.getElementById('guru-search');

  if (!container) return () => { }; // Return empty cleanup if failed

  let cleanupFns = [];

  // Fetch Data
  let guruData = [];
  try {
    const response = await fetch('/data/guru.json');
    guruData = await response.json();
  } catch (error) {
    console.error("Failed to load guru data", error);
    container.innerHTML = '<p class="text-center text-red-500">Gagal memuat data guru.</p>';
    return () => { };
  }

  // Initial Render
  renderHierarchicalGuru(guruData);

  // Search Logic
  if (searchInput) {
    const handleInput = (e) => {
      const keyword = e.target.value.toLowerCase();
      // Clear previous cleanups before re-rendering
      cleanupFns.forEach(fn => fn());
      cleanupFns = [];

      const filtered = guruData.filter(g =>
        g.name.toLowerCase().includes(keyword) ||
        g.role.toLowerCase().includes(keyword) ||
        g.department.toLowerCase().includes(keyword)
      );
      renderHierarchicalGuru(filtered, keyword !== '');
    };
    searchInput.addEventListener('input', handleInput);
  }

  function renderHierarchicalGuru(data, isSearching = false) {
    container.innerHTML = '';

    if (data.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-gray-500 text-lg">Tidak ada guru yang ditemukan.</p>
        </div>
      `;
      return;
    }

    // Group by hierarchy
    const hierarchyOrder = [
      { key: "kepala_sekolah", title: "Kepala Sekolah" },
      { key: "wakil", title: "Wakil Kepala Sekolah" },
      { key: "kepala_konsentrasi", title: "Kepala Konsentrasi" },
      { key: "guru", title: "Guru" },
      { key: "tata_usaha", title: "Tata Usaha" }
    ];

    const grouped = data.reduce((acc, item) => {
      const hier = item.hierarchy;
      if (!acc[hier]) acc[hier] = [];
      acc[hier].push(item);
      return acc;
    }, {});

    hierarchyOrder.forEach(({ key, title }) => {
      const members = grouped[key];
      if (!members || members.length === 0) return;

      const section = document.createElement('div');
      section.className = 'mb-16';
      const cleanKey = key.replace(/\s+/g, '-').replace(/[^\w-]/g, '');

      // Header
      section.innerHTML = `
                <div class="flex items-center gap-4 mb-6 px-4 md:px-0">
                    <h2 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">${title}</h2>
                    <div class="h-px bg-gray-200 flex-1"></div>
                    <span class="text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:inline-block">
                        ${members.length} Orang
                    </span>
                </div>
            `;

      // Scroll Wrapper (Horizontal scroll for all sections)
      const scrollWrapper = document.createElement('div');
      scrollWrapper.className = 'relative group/scroll';

      scrollWrapper.innerHTML = `
                <!-- Indicators -->
                <div id="left-gradient-${cleanKey}" class="opacity-0 transition-opacity duration-300 absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                <div id="right-gradient-${cleanKey}" class="opacity-0 transition-opacity duration-300 absolute right-0 top-0 bottom-0 w-10 md:w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none flex items-center justify-end pr-2 md:pr-3">
                     <div class="text-gray-400 animate-pulse">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                     </div>
                </div>

                <!-- Scrollable Area -->
                <div id="scroll-container-${cleanKey}" 
                     class="flex gap-6 overflow-x-auto pb-8 pt-4 px-4 md:px-0 scrollbar-hide scroll-smooth snap-x snap-mandatory"
                     style="overscroll-behavior-x: contain;">
                    <!-- Content will be inserted here -->
                </div>
            `;

      section.appendChild(scrollWrapper);
      container.appendChild(section);

      // Get the scroll container and populate it
      const scrollContainer = document.getElementById(`scroll-container-${cleanKey}`);

      members.forEach(item => {
        let card;
        if (key === 'kepala_sekolah') {
          card = createPrincipalCard(item);
        } else if (key === 'wakil') {
          card = createViceCard(item);
        } else {
          card = createStandardCard(item);
        }
        scrollContainer.appendChild(card);
      });

      // Add end padding
      const endPadding = document.createElement('div');
      endPadding.className = 'w-1 shrink-0';
      scrollContainer.appendChild(endPadding);

      // Initialize scroll logic
      requestAnimationFrame(() => {
        const scroller = document.getElementById(`scroll-container-${cleanKey}`);
        const leftGrad = document.getElementById(`left-gradient-${cleanKey}`);
        const rightGrad = document.getElementById(`right-gradient-${cleanKey}`);

        if (scroller) {
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
                scroller.scrollLeft += scrollSpeed * direction;

                if (direction === 1 && scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 1) {
                  direction = -1;
                } else if (direction === -1 && scroller.scrollLeft <= 0) {
                  direction = 1;
                }
              }
              animationId = requestAnimationFrame(autoScroll);
            }

            animationId = requestAnimationFrame(autoScroll);

            // Scroll Indicators Logic
            const onScroll = () => {
              if (scroller.scrollLeft > 20) leftGrad.classList.remove('opacity-0');
              else leftGrad.classList.add('opacity-0');

              if (scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth - 20) rightGrad.classList.remove('opacity-0');
              else rightGrad.classList.add('opacity-0');
            };
            scroller.addEventListener('scroll', onScroll);

            // Cleanup
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

  // Create Principal Card (Extra Large & Premium)
  function createPrincipalCard(item) {
    const card = document.createElement('div');
    card.className = 'shrink-0 w-[400px] md:w-[500px] snap-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-all duration-300';

    const initials = item.name.substring(0, 2).toUpperCase();

    card.innerHTML = `
      <div class="p-8 md:p-12 text-center">
        <div class="mb-6 mx-auto w-32 h-32 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl">
          ${initials}
        </div>
        <h3 class="text-3xl md:text-4xl font-bold text-white mb-3">${item.name}</h3>
        <p class="text-xl text-gray-300 font-medium mb-2">${item.role}</p>
        ${item.phone ? `<p class="text-sm text-gray-400 mt-4 flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
          </svg>
          ${item.phone}
        </p>` : ''}
      </div>
    `;

    return card;
  }

  // Create Vice Principal Card (Large)
  function createViceCard(item) {
    const card = document.createElement('div');
    card.className = 'shrink-0 w-[320px] md:w-[380px] snap-center bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300';

    const initials = item.name.substring(0, 2).toUpperCase();

    card.innerHTML = `
      <div class="p-6">
        <div class="mb-4 mx-auto w-24 h-24 bg-gradient-to-br from-primary/20 to-blue-100 rounded-full flex items-center justify-center text-primary text-3xl font-bold">
          ${initials}
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-2 text-center">${item.name}</h3>
        <p class="text-base text-gray-600 font-medium text-center mb-1">${item.role}</p>
        ${item.phone ? `<p class="text-sm text-gray-500 mt-4 text-center flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
          </svg>
          ${item.phone}
        </p>` : ''}
      </div>
    `;

    return card;
  }

  // Create Standard Card
  function createStandardCard(item) {
    const card = document.createElement('div');
    card.className = 'shrink-0 w-[280px] snap-center bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 hover:-translate-y-1 group';

    const initials = item.name.substring(0, 2).toUpperCase();

    card.innerHTML = `
      <div class="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-4xl font-bold text-gray-300 group-hover:from-primary/10 group-hover:to-blue-50 group-hover:text-primary transition-all duration-300">
        ${initials}
      </div>
      <div class="p-5">
        <h3 class="text-lg font-bold mb-1 text-gray-900 truncate">${item.name}</h3>
        <p class="text-sm text-gray-600 font-medium">${item.role}</p>
        <p class="text-xs text-gray-400 mt-2 py-1 px-2 bg-gray-50 rounded-lg inline-block border border-gray-100">${item.department}</p>
        ${item.phone ? `<p class="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
          </svg>
          ${item.phone}
        </p>` : ''}
      </div>
    `;

    return card;
  }

  // Return global cleanup
  return () => {
    cleanupFns.forEach(fn => fn());
  };
}
