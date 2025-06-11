document.addEventListener('DOMContentLoaded', function() {
  function initHomepageSlide() {
    const titles = document.querySelectorAll('.hpslide-title');
    const posterElement = document.querySelector('.hpslide-poster');
    const lowResVideoElement = document.querySelector('.hpslide-video-low');
    const highResVideoElement = document.querySelector('.hpslide-video-high');
    let currentTitle = null;
    let currentTimestamp = 0;

    if (!titles.length || !posterElement || !lowResVideoElement || !highResVideoElement) {
      console.log('hpslide elements not found, waiting for dynamic load');
      return;
    }

    // Preload videos and posters
    const videoCache = new Map();
    const posterCache = new Map();
    titles.forEach(title => {
      const lowResSrc = title.getAttribute('data-lowres');
      const posterSrc = title.getAttribute('data-poster');
      if (lowResSrc) {
        const video = document.createElement('video');
        video.src = lowResSrc;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsinline = true;
        video.preload = 'auto';
        video.load();
        video.play().then(() => video.pause()).catch(err => console.error(`Failed to preload ${lowResSrc}:`, err));
        videoCache.set(lowResSrc, video);
      }
      if (posterSrc) {
        const img = new Image();
        img.src = posterSrc;
        img.onload = () => console.log(`Poster ${posterSrc} loaded`);
        img.onerror = () => console.error(`Failed to load poster ${posterSrc}`);
        posterCache.set(posterSrc, img);
      }
    });

    function setActiveTitle(newTitle) {
      if (currentTitle) {
        currentTitle.classList.remove('active');
      }
      newTitle.classList.add('active');
      currentTitle = newTitle;
    }

    function triggerVideo(title, timestamp) {
      const lowResSrc = title.getAttribute('data-lowres');
      const highResSrc = title.getAttribute('data-highres');
      const posterSrc = title.getAttribute('data-poster');

      if (!lowResSrc || !highResSrc || !posterSrc) {
        console.error('Missing video or poster source');
        return;
      }

      currentTimestamp = timestamp;
      posterElement.src = posterSrc;
      posterElement.classList.add('active');
      lowResVideoElement.classList.remove('active');
      highResVideoElement.classList.remove('active');

      lowResVideoElement.src = lowResSrc;
      lowResVideoElement.load();

      const onLowResPlaying = () => {
        if (currentTimestamp !== timestamp) return;
        lowResVideoElement.play().then(() => {
          requestAnimationFrame(() => {
            lowResVideoElement.classList.add('active');
            setTimeout(() => {
              if (currentTimestamp === timestamp) {
                posterElement.classList.remove('active');
              }
            }, 150);
          });
        }).catch(err => {
          console.error('Low-res video playback failed:', err);
          if (currentTimestamp === timestamp) {
            posterElement.classList.add('active');
          }
        });
        lowResVideoElement.removeEventListener('playing', onLowResPlaying);
      };
      lowResVideoElement.addEventListener('playing', onLowResPlaying);

      const highResVideo = document.createElement('video');
      highResVideo.src = highResSrc;
      highResVideo.autoplay = true;
      highResVideo.muted = true;
      highResVideo.loop = true;
      highResVideo.playsinline = true;
      highResVideo.preload = 'auto';
      highResVideo.load();
      highResVideo.oncanplaythrough = () => {
        if (currentTimestamp !== timestamp) return;
        const currentTime = lowResVideoElement.currentTime;
        highResVideoElement.src = highResSrc;
        highResVideoElement.currentTime = currentTime;
        highResVideoElement.play().then(() => {
          requestAnimationFrame(() => {
            highResVideoElement.classList.add('active');
            setTimeout(() => {
              if (currentTimestamp === timestamp) {
                lowResVideoElement.classList.remove('active');
              }
            }, 150);
          });
        }).catch(err => {
          console.error('High-res video playback failed:', err);
          if (currentTimestamp === timestamp) {
            lowResVideoElement.classList.add('active');
          }
        });
      };
    }

    titles.forEach(title => {
      title.addEventListener('mouseenter', () => {
        if (title !== currentTitle) {
          console.log('Hover on title:', title.querySelector('h1').textContent);
          setActiveTitle(title);
          triggerVideo(title, Date.now());
        }
      });
    });

    if (titles.length > 0) {
      setTimeout(() => {
        const firstTitle = titles[0];
        if (!currentTitle) {
          console.log('Auto-triggering first slide');
          setActiveTitle(firstTitle);
          triggerVideo(firstTitle, Date.now());
        }
      }, 0);
    }

    console.log('Homepage slide initialized');
  }

  // Wait for jQuery and hpslide to load
  function checkAndInit() {
    if (window.jQuery && document.querySelector('.hpslide-wrapper')) {
      initHomepageSlide();
    } else {
      setTimeout(checkAndInit, 100);
    }
  }
  checkAndInit();
});