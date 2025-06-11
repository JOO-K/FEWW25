document.addEventListener('DOMContentLoaded', function() {
  // Function to initialize toggle functionality
  function initArchiveToggle() {
    const toggleButton = document.querySelector('#archiveToggle');
    const archiveWrapper = document.querySelector('.archive-wrapper');

    // Check if both elements exist
    if (toggleButton && archiveWrapper) {
      toggleButton.addEventListener('click', function() {
        // Toggle archive menu display and nav-link styles
        if (archiveWrapper.style.display === 'none' || archiveWrapper.style.display === '') {
          archiveWrapper.style.display = 'flex';
          toggleButton.style.backgroundColor = 'darkgreen';
          toggleButton.style.color = '#e0e0e0';
        } else {
          archiveWrapper.style.display = 'none';
          toggleButton.style.backgroundColor = '';
          toggleButton.style.color = ''; // Revert to CSS default
        }
      });
      console.log('Archive toggle initialized');
    } else {
      console.log('Toggle button or archive wrapper not found');
    }
  }

  // Initial attempt to initialize
  initArchiveToggle();

  // Observe DOM changes to catch dynamically loaded archivemenu and navigation
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        // Check if both archivemenu and toggle button are loaded
        if (document.querySelector('.archive-wrapper') && document.querySelector('#archiveToggle')) {
          initArchiveToggle();
          observer.disconnect();
        }
      }
    });
  });

  // Start observing the body for child changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});