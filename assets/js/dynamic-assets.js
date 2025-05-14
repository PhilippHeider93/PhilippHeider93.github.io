// dynamic-assets.js - Handles dynamic loading of assets to prevent direct references in HTML

document.addEventListener('DOMContentLoaded', function() {
  // Map of asset keys to their actual paths
  const assetMap = {
    'avatar': 'assets/img/me.png',
    // Add other assets you want to load dynamically
    'logo': 'assets/img/logo.png',
    'background': 'assets/img/background.jpg'
  };

  // Function to load avatar image
  function loadAvatar() {
    const avatarImage = document.querySelector('.avatar__box image');
    if (avatarImage) {
      // Set the xlink:href attribute dynamically
      avatarImage.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', assetMap['avatar']);
    }
  }

  // Function to load any image by data attribute
  function loadDynamicImages() {
    const dynamicImages = document.querySelectorAll('[data-image-key]');
    dynamicImages.forEach(img => {
      const key = img.getAttribute('data-image-key');
      if (key && assetMap[key]) {
        // Check if it's an SVG image element (uses xlink:href)
        if (img.tagName.toLowerCase() === 'image') {
          img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', assetMap[key]);
        } else {
          // Regular img element
          img.src = assetMap[key];
        }
      }
    });
  }

  // Load all dynamic assets
  loadAvatar();
  loadDynamicImages();
});