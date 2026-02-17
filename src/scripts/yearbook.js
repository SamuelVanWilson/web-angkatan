import { PageFlip } from 'page-flip/dist/js/page-flip.module.js';
import gsap from 'gsap';

document.addEventListener('DOMContentLoaded', () => {
    initYearbook();
});

export async function initYearbook() {
    const bookContainer = document.getElementById('yearbook');
    const controls = document.getElementById('book-controls');
    const loadingScreen = document.getElementById('loading-screen');
    const container = document.getElementById('book-container');

    console.log("Init Yearbook Called!");

    // Safety Timeout
    setTimeout(() => {
        if (loadingScreen && loadingScreen.style.opacity !== '0') {
            console.warn("Loading timeout - forcing display");
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                if (loadingScreen.parentNode) loadingScreen.parentNode.removeChild(loadingScreen);
            }, 1000);
            if (container) container.style.opacity = '1';
            if (controls) controls.style.opacity = '1';
        }
    }, 5000);

    try {
        // 1. Generate Pages
        const urlParams = new URLSearchParams(window.location.search);
        const classId = urlParams.get('class');
        let pagesHTML = '';
        let imagesToLoad = [];

        // Fetch ALL yearbook data from the single source of truth
        try {
            const response = await fetch('/src/data/yearbook.json');
            const allYearbooks = await response.json();

            let targetData = null;

            if (classId) {
                // Try to find specific class
                targetData = allYearbooks.find(item => item.id === classId);

                // Fallback attempt
                if (!targetData) {
                    console.warn(`Class ${classId} not found in yearbook.json, checking kelas.json fallback...`);
                    try {
                        const classRes = await fetch('/src/data/kelas.json');
                        const classJson = await classRes.json();
                        const legacyData = classJson.find(item => item.id === classId);
                        if (legacyData && (legacyData.yearbookPages || legacyData.yearbookImages)) {
                            targetData = {
                                id: legacyData.id,
                                pages: legacyData.yearbookPages || legacyData.yearbookImages
                            };
                        }
                    } catch (err) {
                        console.error("Legacy fallback failed", err);
                    }
                }
            } else {
                // Default to 'angkatan_20'
                targetData = allYearbooks.find(item => item.id === 'angkatan_20');
            }

            if (targetData && targetData.pages && targetData.pages.length > 0) {
                imagesToLoad = targetData.pages;
            } else {
                console.warn("No pages found for target ID.");
            }

        } catch (e) {
            console.error("Error loading yearbook data:", e);
        }

        if (imagesToLoad.length > 0) {
            pagesHTML = generatePagesFromImages(imagesToLoad);
        } else {
            // Fallback content if really empty
            pagesHTML = `<div class="page" data-density="hard"><div class="page-content bg-black text-white flex items-center justify-center">No Pages Found</div></div>`;
        }


        if (bookContainer) {
            bookContainer.innerHTML = pagesHTML;
        } else {
            throw new Error("#yearbook element not found");
        }

        // 2. Initialize PageFlip
        // Dynamic Sizing for ALL Screens
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const isMobile = screenW < 768;

        // Calculate page size dynamically to FIT within the screen

        let pageWidth = 400; // default
        let pageHeight = 600;

        // Target Aspect Ratio for ONE PAGE (Standard Portrait)
        const targetRatio = 0.75;

        if (isMobile) {
            // Mobile
            const safeW = screenW * 0.95;
            const safeH = screenH * 0.8;

            // Base calculation on Width
            pageWidth = Math.floor(safeW / 2); // Spread mode divides by 2
            pageHeight = Math.floor(pageWidth / targetRatio);

            // Check Height Constraint
            if (pageHeight > safeH) {
                pageHeight = Math.floor(safeH);
                pageWidth = Math.floor(pageHeight * targetRatio);
            }

        } else {
            // Desktop: The Spread (2 pages) must fit in screen
            // Use tighter constraints to avoid overflow
            const safeW = screenW * 0.85;
            const safeH = screenH * 0.85;

            // 1. Calculate based on limiting Height first (safest for wide screens)
            let potentialH = safeH;
            let potentialSingleW = potentialH * targetRatio;
            let potentialSpreadW = potentialSingleW * 2;

            if (potentialSpreadW <= safeW) {
                // Good, fits in width too
                pageHeight = Math.floor(potentialH);
                pageWidth = Math.floor(potentialSingleW);
            } else {
                // Too wide, limit by Width
                let potentialSpreadW_2 = safeW;
                let potentialSingleW_2 = potentialSpreadW_2 / 2;
                let potentialH_2 = potentialSingleW_2 / targetRatio;

                pageHeight = Math.floor(potentialH_2);
                pageWidth = Math.floor(potentialSingleW_2);
            }
        }

        // Min/Max clamps
        if (pageWidth < 150) pageWidth = 150;
        if (pageHeight < 200) pageHeight = 200;

        console.log(`Calculated Page Size: ${pageWidth}x${pageHeight} (Spread: ${pageWidth * 2}x${pageHeight})`);

        setTimeout(() => {
            try {
                const pageFlip = new PageFlip(bookContainer, {
                    width: pageWidth,
                    height: pageHeight,
                    size: 'fixed',
                    minWidth: 100, // Allow small pages for mobile
                    maxWidth: 2000,
                    minHeight: 100,
                    maxHeight: 2000,
                    maxShadowOpacity: 0.5,
                    showCover: true,
                    mobileScrollSupport: false,
                    usePortrait: false, // FORCE 2-PAGE SPREAD EVE ON MOBILE (Standard book feel)
                    startPage: 0,
                    drawShadow: true
                });

                // Load pages
                const pages = document.querySelectorAll('.page');
                if (pages.length > 0) {
                    pageFlip.loadFromHTML(pages);
                } else {
                    console.warn("No pages found to load");
                }

                // 3. Opening Animation
                if (loadingScreen) {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        if (loadingScreen.parentNode) loadingScreen.parentNode.removeChild(loadingScreen);
                    }, 1000);
                }

                if (container) {
                    container.style.opacity = '1';
                    container.style.transform = 'scale(1)';
                }

                setTimeout(() => {
                    if (controls) controls.style.opacity = '1';
                }, 1500);


                // Event Listeners
                if (controls) {
                    const prevBtn = document.getElementById('prev-btn');
                    const nextBtn = document.getElementById('next-btn');

                    // Reset listeners
                    if (prevBtn) prevBtn.onclick = () => pageFlip.flipPrev();
                    if (nextBtn) nextBtn.onclick = () => pageFlip.flipNext();

                    // Update page number
                    pageFlip.on('flip', (e) => {
                        const pageNumDisplay = document.getElementById('page-num');
                        if (pageNumDisplay) {
                            const current = e.data + 1; // 0-indexed

                            if (current === 1) pageNumDisplay.textContent = "Cover";
                            else if (current === pageFlip.getPageCount()) pageNumDisplay.textContent = "End";
                            else pageNumDisplay.textContent = `${current - 1}`;
                        }
                    });
                }

                // Guide Modal Logic
                const guideBtn = document.getElementById('guide-btn');
                const guideModal = document.getElementById('guide-modal');
                const closeGuide = document.getElementById('close-guide');

                // --- MOBILE TOUCH FIX: SPINE BLOCKER ---
                if (isMobile) {
                    const blocker = document.createElement('div');
                    blocker.style.position = 'absolute';
                    blocker.style.top = '0';
                    blocker.style.left = '50%';
                    blocker.style.transform = 'translateX(-50%)';
                    blocker.style.width = '15%';
                    blocker.style.height = '100%';
                    blocker.style.zIndex = '20';
                    blocker.style.backgroundColor = 'transparent';

                    // Stop interactions in this zone
                    const stopEvent = (e) => {
                        e.stopPropagation();
                    };

                    blocker.addEventListener('click', stopEvent);
                    blocker.addEventListener('mousedown', stopEvent);
                    blocker.addEventListener('touchstart', stopEvent);

                    bookContainer.style.position = 'relative';
                    bookContainer.appendChild(blocker);
                }

                if (guideBtn && guideModal && closeGuide) {
                    if (!localStorage.getItem('yearbookGuideShown')) {
                        setTimeout(() => {
                            guideModal.classList.remove('hidden');
                            guideModal.classList.remove('opacity-0');
                            localStorage.setItem('yearbookGuideShown', 'true');
                        }, 2000);
                    }

                    guideBtn.onclick = () => {
                        guideModal.classList.remove('hidden');
                        setTimeout(() => guideModal.classList.remove('opacity-0'), 10);
                    };

                    closeGuide.onclick = () => {
                        guideModal.classList.add('opacity-0');
                        setTimeout(() => guideModal.classList.add('hidden'), 300);
                    };
                }

            } catch (err) {
                console.error("PageFlip Init Error:", err);
                if (loadingScreen) loadingScreen.innerHTML = `<p class="text-red-500 font-bold p-4 text-center">Gagal memuat animasi buku.<br><span class="text-sm font-normal text-white">${err.message}</span></p>`;
            }

        }, 500);

    } catch (error) {
        console.error("Critical Error:", error);
        if (loadingScreen) loadingScreen.innerHTML = `<p class="text-red-500 font-bold p-4 text-center">Critical Error.<br><span class="text-sm font-normal text-white">${error.message}</span></p>`;
    }
}

function generatePagesFromImages(images) {
    let html = '';

    images.forEach((imgUrl, index) => {
        // First page is usually Hard cover
        const isHard = index === 0 || index === images.length - 1;
        const density = isHard ? 'hard' : 'soft';

        // FORCE FULL BLEED
        // !important to override .page-content padding from style.css
        html += `
        <div class="page" data-density="${density}">
            <div class="page-content bg-transparent w-full h-full m-0 overflow-hidden flex items-center justify-center p-0" style="padding: 0 !important; background-color: transparent !important;">
                <img src="${imgUrl}" class="w-full h-full block object-cover" style="min-width: 100%; min-height: 100%; width: 100%; height: 100%; object-fit: fill;" loading="lazy" alt="Page ${index + 1}">
            </div>
        </div>
        `;
    });

    return html;
}
