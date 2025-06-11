document.addEventListener('DOMContentLoaded', () => {
  console.log('hpslide.js: DOM loaded');

  function initHomepageSlide() {
    console.log('hpslide.js: Initializing');
    const titles = document.querySelectorAll('.hpslide-title');
    const frameElement = document.querySelector('.hpslide-frame');
    let currentTitle = null;
    let currentTimestamp = null;
    let animationFrameId = null;
    const frameInterval = 100; // 10 FPS (1000ms / 10)
    const projectCaches = new Map();
    const defaultImage = 'https://placehold.co/800x600/png?text=Image+Not+Available'; // Reliable fallback
    let isSwitching = false; // Debounce title switches
    let autoSwitchInterval = null;
    let lastInteraction = 0; // Track last user interaction
    let currentIndex = 0; // Track current title index for auto-switch

    // Detect mobile based on screen width
    const isMobile = window.innerWidth < 800;
    console.log(`hpslide.js: Initial screen width: ${window.innerWidth}px, isMobile: ${isMobile}`);

    // Set frame count based on device
    const frameCount = isMobile ? 25 : 50; // 25 for mobile, 50 for desktop

    if (!titles.length || !frameElement) {
      console.error('hpslide.js error: Missing elements. titles.length=', titles.length, 'frameElement=', frameElement);
      return;
    }

    // Preload first frame of each project immediately
    titles.forEach(title => {
      let sequenceBase = title.getAttribute('data-sequence');
      if (!sequenceBase) {
        console.error('hpslide.js error: Missing data-sequence for title', title);
        return;
      }
      // Append 'low_' for mobile, preserving double underscore for Project3
      const projectName = sequenceBase.match(/Project(\d+_{0,2})/)[0];
      const modifiedSequenceBase = isMobile ? sequenceBase.replace(projectName, `${projectName.slice(0, -1)}low_`) : sequenceBase;

      if (!projectCaches.has(modifiedSequenceBase)) {
        projectCaches.set(modifiedSequenceBase, { sources: [], images: [], loaded: new Set(), failed: new Set() });
        const firstFrame = `${modifiedSequenceBase}00000.png`;
        console.log(`hpslide.js: Loading first frame ${firstFrame}`);
        const img = new Image();
        img.src = firstFrame;
        img.onload = () => {
          console.log(`hpslide.js: First frame ${firstFrame} loaded`);
          projectCaches.get(modifiedSequenceBase).loaded.add(firstFrame);
          // Set initial frame for Project1
          if (title === titles[0] && !frameElement.src) {
            frameElement.src = firstFrame;
            frameElement.classList.add('active');
          }
        };
        img.onerror = () => {
          console.error(`hpslide.js: Failed to load first frame ${firstFrame}`);
          projectCaches.get(modifiedSequenceBase).failed.add(firstFrame);
          if (title === titles[0] && !frameElement.src) {
            frameElement.src = defaultImage;
            frameElement.classList.add('active');
          }
        };
        projectCaches.get(modifiedSequenceBase).images[0] = img;
        projectCaches.get(modifiedSequenceBase).sources[0] = firstFrame;
      }
    });

    // Preload remaining images in background
    titles.forEach(title => {
      let sequenceBase = title.getAttribute('data-sequence');
      if (!sequenceBase) return;
      const projectName = sequenceBase.match(/Project(\d+_{0,2})/)[0];
      const modifiedSequenceBase = isMobile ? sequenceBase.replace(projectName, `${projectName.slice(0, -1)}low_`) : sequenceBase;

      const cache = projectCaches.get(modifiedSequenceBase);
      if (cache.sources.length === 1) { // Only first frame added so far
        console.log(`hpslide.js: Preloading remaining images for ${modifiedSequenceBase}`);
        const isFirstProject = title === titles[0];
        for (let i = 1; i < frameCount; i++) {
          const frameNum = i.toString().padStart(5, '0');
          const src = `${modifiedSequenceBase}${frameNum}.png`;
          cache.sources[i] = src;
          setTimeout(() => {
            console.log(`hpslide.js: Attempting to load ${src}`);
            const img = new Image();
            img.src = src;
            img.onload = () => {
              console.log(`hpslide.js: Frame ${src} loaded`);
              cache.loaded.add(src);
            };
            img.onerror = () => {
              console.error(`hpslide.js: Failed to load frame ${src}`);
              cache.failed.add(src);
            };
            cache.images[i] = img;
          }, (isFirstProject ? i : i + frameCount) * 50); // Prioritize first project
        }
      }
    });

    function setActiveTitle(newTitle) {
      if (currentTitle && currentTitle !== newTitle) {
        currentTitle.classList.remove('active');
      }
      newTitle.classList.add('active');
      currentTitle = newTitle;
      currentIndex = Array.from(titles).indexOf(newTitle);
    }

    function stopCurrentSequence() {
      if (animationFrameId) {
        clearTimeout(animationFrameId);
        animationFrameId = null;
      }
      frameElement.classList.remove('active');
    }

    function triggerSequence(title, timestamp) {
      if (isSwitching) {
        console.log('hpslide.js: Debouncing switch for', title.querySelector('h1').textContent);
        return;
      }
      isSwitching = true;
      setTimeout(() => { isSwitching = false; }, 200); // Debounce for 200ms

      let sequenceBase = title.getAttribute('data-sequence');
      if (!sequenceBase) {
        console.error('hpslide.js error: No data-sequence for title', title);
        isSwitching = false;
        return;
      }
      // Append 'low_' for mobile, preserving double underscore for Project3
      const projectName = sequenceBase.match(/Project(\d+_{0,2})/)[0];
      const modifiedSequenceBase = isMobile ? sequenceBase.replace(projectName, `${projectName.slice(0, -1)}low_`) : sequenceBase;

      console.log(`hpslide.js: Triggering ${modifiedSequenceBase}`);
      currentTimestamp = timestamp;

      const cache = projectCaches.get(modifiedSequenceBase);
      let currentFrame = 0;

      function animateSequence() {
        if (currentTimestamp !== timestamp) {
          console.log(`hpslide.js: Stopping animation for ${modifiedSequenceBase}`);
          return;
        }
        currentFrame = (currentFrame + 1) % frameCount;
        const frameNum = currentFrame.toString().padStart(5, '0');
        const src = `${modifiedSequenceBase}${frameNum}.png`;

        // Use loaded image, first frame, or placeholder
        if (cache.loaded.has(src) || cache.images[currentFrame]?.complete) {
          frameElement.src = src;
        } else if (cache.failed.has(src)) {
          frameElement.src = defaultImage;
        } else {
          const firstFrame = cache.sources[0];
          frameElement.src = cache.loaded.has(firstFrame) || cache.images[0]?.complete ? firstFrame : defaultImage;
        }
        frameElement.classList.add('active');

        animationFrameId = setTimeout(animateSequence, frameInterval);
      }

      // Start with first frame if loaded, else placeholder
      const firstFrame = `${modifiedSequenceBase}00000.png`;
      frameElement.src = cache.loaded.has(firstFrame) || cache.images[0]?.complete ? firstFrame : defaultImage;
      frameElement.classList.add('active');
      console.log(`hpslide.js: Starting animation with ${frameElement.src}`);

      // Only start animation if at least one frame is loaded
      if (cache.loaded.size > 0 || cache.images.some(img => img && img.complete)) {
        animateSequence();
      } else {
        console.log(`hpslide.js: Delaying animation for ${modifiedSequenceBase} until frames load`);
        const checkLoaded = setInterval(() => {
          if (cache.loaded.size > 0 || cache.images.some(img => img && img.complete)) {
            clearInterval(checkLoaded);
            animateSequence();
          }
        }, 100);
      }
    }

    // Auto-switch titles every 5 seconds
    function startAutoSwitch() {
      clearInterval(autoSwitchInterval); // Clear any existing interval
      autoSwitchInterval = setInterval(() => {
        const now = Date.now();
        // Only switch if no recent user interaction
        if (now - lastInteraction >= 5000) {
          currentIndex = (currentIndex + 1) % titles.length;
          const nextTitle = titles[currentIndex];
          console.log(`hpslide.js: Auto-switching to ${nextTitle.querySelector('h1').textContent}`);
          setActiveTitle(nextTitle);
          stopCurrentSequence();
          triggerSequence(nextTitle, Date.now());
        }
      }, 5000);
    }

    titles.forEach(title => {
      title.addEventListener('mouseenter', () => {
        if (title !== currentTitle) {
          console.log('hpslide.js: Hover on:', title.querySelector('h1').textContent);
          lastInteraction = Date.now();
          setActiveTitle(title);
          stopCurrentSequence();
          triggerSequence(title, Date.now());
          startAutoSwitch();
        }
      });
      title.addEventListener('touchstart', (e) => {
        const isLinkClick = e.target.closest('a');
        if (isMobile && title === currentTitle && isLinkClick) {
          console.log('hpslide.js: Allowing link click for:', title.querySelector('h1').textContent);
          return;
        }
        e.preventDefault();
        if (title !== currentTitle) {
          console.log('hpslide.js: Touch on:', title.querySelector('h1').textContent);
          lastInteraction = Date.now();
          setActiveTitle(title);
          stopCurrentSequence();
          triggerSequence(title, Date.now());
          startAutoSwitch();
        }
      });

      // Add click listener for <a> tags wrapping titles
      const link = title.closest('a');
      if (link && isMobile) {
        link.addEventListener('click', (e) => {
          if (title === currentTitle) {
            console.log('hpslide.js: Link clicked for active title:', title.querySelector('h1').textContent);
          } else {
            e.preventDefault();
            console.log('hpslide.js: Toggling sequence for:', title.querySelector('h1').textContent);
            lastInteraction = Date.now();
            setActiveTitle(title);
            stopCurrentSequence();
            triggerSequence(title, Date.now());
            startAutoSwitch();
          }
        });
      }
    });

    // Activate first title by default and start auto-switch
    if (titles.length > 0) {
      setTimeout(() => {
        const firstTitle = titles[0];
        if (!currentTitle) {
          console.log('hpslide.js: Auto-activating first slide');
          setActiveTitle(firstTitle);
          triggerSequence(firstTitle, Date.now());
          startAutoSwitch();
        }
      }, 200);
    }

    console.log('hpslide.js: Initialized');
  }

  function checkAndInit() {
    if (window.jQuery && document.querySelector('.hpslide-wrapper')) {
      console.log('hpslide.js: jQuery and .hpslide-wrapper found');
      initHomepageSlide();
    } else {
      console.log('hpslide.js: Waiting for jQuery or .hpslide-wrapper');
      setTimeout(checkAndInit, 100);
    }
  }
  checkAndInit();
});