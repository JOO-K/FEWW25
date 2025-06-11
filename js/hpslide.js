document.addEventListener('DOMContentLoaded', () => {
  console.log('hpslide.js: DOM loaded');

  function initHomepageSlide() {
    console.log('hpslide.js: Initializing');
    const titles = document.querySelectorAll('.hpslide-title');
    const frameElement = document.querySelector('.hpslide-frame');
    let currentTitle = null;
    let currentTimestamp = null;
    let animationFrameId = null;
    const frameCount = 25;
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

    if (!titles.length || !frameElement) {
      console.error('hpslide.js error: Missing elements. titles.length=', titles.length, 'frameElement=', frameElement);
      return;
    }

    // Preload all images for all projects
    titles.forEach(title => {
      let sequenceBase = title.getAttribute('data-sequence');
      if (!sequenceBase) {
        console.error('hpslide.js error: Missing data-sequence for title', title);
        return;
      }
      // Append 'low_' for mobile
      if (isMobile) {
        sequenceBase = sequenceBase.replace(/Project(\d+)_/, 'Project$1low_');
      }
      if (!projectCaches.has(sequenceBase)) {
        console.log(`hpslide.js: Preloading images for ${sequenceBase}`);
        const imageSources = [];
        for (let i = 0; i < frameCount; i++) {
          const frameNum = i.toString().padStart(5, '0');
          imageSources.push(`${sequenceBase}${frameNum}.png`);
        }
        projectCaches.set(sequenceBase, { sources: imageSources, images: [], failed: new Set() });
        // Prioritize first project's images
        const isFirstProject = title === titles[0];
        imageSources.forEach((src, index) => {
          setTimeout(() => {
            console.log(`hpslide.js: Attempting to load ${src}`);
            const img = new Image();
            img.src = src;
            img.onload = () => console.log(`hpslide.js: Frame ${src} loaded`);
            img.onerror = () => {
              console.error(`hpslide.js: Failed to load frame ${src}`);
              projectCaches.get(sequenceBase).failed.add(src);
            };
            projectCaches.get(sequenceBase).images.push(img);
          }, (isFirstProject ? index : index + frameCount) * 50); // Prioritize first project
        });
      }
    });

    function setActiveTitle(newTitle) {
      if (currentTitle && currentTitle !== newTitle) {
        currentTitle.classList.remove('active');
      }
      newTitle.classList.add('active');
      currentTitle = newTitle;
      // Update currentIndex to match newTitle
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
      // Append 'low_' for mobile
      if (isMobile) {
        sequenceBase = sequenceBase.replace(/Project(\d+)_/, 'Project$1low_');
      }

      console.log(`hpslide.js: Triggering ${sequenceBase}`);
      currentTimestamp = timestamp;

      const cache = projectCaches.get(sequenceBase);
      let currentFrame = 0;

      function animateSequence() {
        if (currentTimestamp !== timestamp) {
          console.log(`hpslide.js: Stopping animation for ${sequenceBase}`);
          return;
        }
        currentFrame = (currentFrame + 1) % frameCount;
        const frameNum = currentFrame.toString().padStart(5, '0');
        const src = `${sequenceBase}${frameNum}.png`;

        frameElement.src = cache.failed.has(src) ? defaultImage : src;
        frameElement.classList.add('active');

        animationFrameId = setTimeout(animateSequence, frameInterval);
      }

      const firstFrame = `${sequenceBase}00000.png`;
      frameElement.src = cache.failed.has(firstFrame) ? defaultImage : firstFrame;
      frameElement.classList.add('active');
      console.log(`hpslide.js: Starting animation with ${firstFrame}`);
      animateSequence();
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
          lastInteraction = Date.now(); // Record interaction
          setActiveTitle(title);
          stopCurrentSequence();
          triggerSequence(title, Date.now());
          startAutoSwitch(); // Restart auto-switch timer
        }
      });
      title.addEventListener('touchstart', (e) => {
        // Check if clicking on an <a> tag or the active title
        const isLinkClick = e.target.closest('a');
        if (isMobile && title === currentTitle && isLinkClick) {
          console.log('hpslide.js: Allowing link click for:', title.querySelector('h1').textContent);
          // Allow default link behavior
          return; // Skip toggling
        }
        e.preventDefault(); // Prevent default only for toggling
        if (title !== currentTitle) {
          console.log('hpslide.js: Touch on:', title.querySelector('h1').textContent);
          lastInteraction = Date.now(); // Record interaction
          setActiveTitle(title);
          stopCurrentSequence();
          triggerSequence(title, Date.now());
          startAutoSwitch(); // Restart auto-switch timer
        }
      });

      // Add click listener for <a> tags within titles
      const link = title.querySelector('a');
      if (link && isMobile) {
        link.addEventListener('click', (e) => {
          if (title === currentTitle) {
            console.log('hpslide.js: Link clicked for active title:', title.querySelector('h1').textContent);
            // Allow default link behavior
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
          startAutoSwitch(); // Start auto-switch
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