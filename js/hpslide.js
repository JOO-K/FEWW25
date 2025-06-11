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
    const defaultImage = 'https://via.placeholder.com/800x600.png?text=Image+Not+Available'; // Fallback
    let isSwitching = false; // Debounce title switches

    // Detect mobile device
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent);
    console.log(`hpslide.js: Device type: ${isMobile ? 'Mobile' : 'Desktop'}`);

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
        const baseParts = sequenceBase.split('_');
        sequenceBase = baseParts[0] + 'low_' + (baseParts[1] || '');
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
        const baseParts = sequenceBase.split('_');
        sequenceBase = baseParts[0] + 'low_' + (baseParts[1] || '');
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

    titles.forEach(title => {
      title.addEventListener('mouseenter', () => {
        if (title !== currentTitle) {
          console.log('hpslide.js: Hover on:', title.querySelector('h1').textContent);
          setActiveTitle(title);
          stopCurrentSequence();
          triggerSequence(title, Date.now());
        }
      });
      title.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (title !== currentTitle) {
          console.log('hpslide.js: Touch on:', title.querySelector('h1').textContent);
          setActiveTitle(title);
          stopCurrentSequence();
          triggerSequence(title, Date.now());
        }
      });
    });

    // Activate first title by default
    if (titles.length > 0) {
      setTimeout(() => {
        const firstTitle = titles[0];
        if (!currentTitle) {
          console.log('hpslide.js: Auto-activating first slide');
          setActiveTitle(firstTitle);
          triggerSequence(firstTitle, Date.now());
        }
      }, 100);
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