// media-popup.js - Handles image and video modal popup with zoom/drag functionality

document.addEventListener('DOMContentLoaded', function() {
  const popup = document.getElementById('imagePopup');
  const popupContent = document.querySelector('.popup-image-container');
  const popupTitle = document.querySelector('.popup-title');
  const closeBtn = document.querySelector('.popup-close');
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const resetBtn = document.getElementById('resetView');
  
  // Variables for transform
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let startX, startY;
  let lastTouchDistance = 0;
  let currentMedia = null;
  let isVideo = false;
  let isIframe = false;
  
  // Store OneDrive embed URLs in a secure map with code identifiers
  // This prevents the URLs from being directly visible in the HTML source
  const embedMap = {
    // Use simple key names that don't reveal the actual content
    'synably': 'https://1drv.ms/v/c/b14276315fd21aa5/IQSGhfM7C6WRTLLkuP15KmaEAcdg_Ru_BmBNAqfusSdRSAg',
    // Add more video mappings as needed
    'project2': 'your_second_onedrive_url_here'
  };
  
  // Initialize popup with either image, video, or iframe
  function openPopup(src, title, type = 'image', embedKey = null) {
    popupTitle.textContent = title;
    isVideo = type === 'video';
    isIframe = type === 'iframe';
    
    // Remove any existing media
    while (popupContent.firstChild) {
      popupContent.removeChild(popupContent.firstChild);
    }
    
    // Toggle zoom controls visibility
    const zoomControls = document.querySelector('.popup-controls');
    zoomControls.style.display = isIframe ? 'none' : 'flex';
    
    if (isIframe && embedKey) {
      // Get the embed URL from our secure map
      const embedUrl = embedMap[embedKey];
      if (!embedUrl) {
        console.error('Embed URL not found for key:', embedKey);
        return;
      }
      
      // Create container for responsive iframe
      const iframeContainer = document.createElement('div');
      iframeContainer.className = 'iframe-container';
      
      // Create and configure the iframe
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.frameBorder = '0';
      iframe.scrolling = 'no';
      iframe.allowFullscreen = true;
      
      // Add iframe to container
      iframeContainer.appendChild(iframe);
      popupContent.appendChild(iframeContainer);
      popupContent.classList.add('iframe-mode');
      currentMedia = iframe;
      
    } else if (isVideo) {
      // Create video element
      const video = document.createElement('video');
      video.id = 'popupVideo';
      video.src = src;
      video.controls = true;
      video.controlsList = "nodownload";
      video.autoplay = false;
      video.style.maxHeight = '85%';
      video.style.maxWidth = '85%';
      video.style.transition = 'transform 0.2s ease';
      video.style.transformOrigin = 'center center';
      video.style.boxShadow = '0 5px 25px rgba(0, 0, 0, 0.2)';
      popupContent.appendChild(video);
      popupContent.classList.remove('iframe-mode');
      currentMedia = video;
      
    } else {
      // Create image element
      const img = document.createElement('img');
      img.id = 'popupImage';
      img.src = src;
      img.alt = 'Enlarged view';
      img.style.maxHeight = '85%';
      img.style.maxWidth = '85%';
      img.style.transition = 'transform 0.2s ease';
      img.style.transformOrigin = 'center center';
      img.style.boxShadow = '0 5px 25px rgba(0, 0, 0, 0.2)';
      popupContent.appendChild(img);
      popupContent.classList.remove('iframe-mode');
      currentMedia = img;
    }
    
    popup.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Only setup zoom/pan for images and videos
    if (!isIframe) {
      resetTransform();
      setupMediaInteraction(currentMedia);
    }
  }
  
  // Setup interaction events for current media (image or video)
  function setupMediaInteraction(media) {
    // Mouse wheel zoom
    media.addEventListener('wheel', handleWheel);
    
    // Drag start
    media.addEventListener('mousedown', handleMouseDown);
    
    // Touch events for mobile
    media.addEventListener('touchstart', handleTouchStart);
    media.addEventListener('touchmove', handleTouchMove);
    media.addEventListener('touchend', handleTouchEnd);
    
    // Double click to reset
    media.addEventListener('dblclick', resetTransform);
  }
  
  // Event handler for wheel zoom
  function handleWheel(e) {
    e.preventDefault();
    
    const rect = currentMedia.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const relX = mouseX / currentMedia.offsetWidth;
    const relY = mouseY / currentMedia.offsetHeight;
    
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    const newScale = Math.max(0.5, Math.min(5, scale + delta));
    
    const originalWidth = currentMedia.offsetWidth / scale;
    const originalHeight = currentMedia.offsetHeight / scale;
    
    if (delta > 0) {
      translateX -= (newScale - scale) * originalWidth * (relX - 0.5);
      translateY -= (newScale - scale) * originalHeight * (relY - 0.5);
    } else {
      translateX += (scale - newScale) * originalWidth * (relX - 0.5);
      translateY += (scale - newScale) * originalHeight * (relY - 0.5);
    }
    
    scale = newScale;
    applyTransform();
  }
  
  // Mouse down handler
  function handleMouseDown(e) {
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    currentMedia.style.cursor = 'grabbing';
  }
  
  // Touch start handler
  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX - translateX;
      startY = e.touches[0].clientY - translateY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      lastTouchDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }
  
  // Touch move handler
  function handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging) {
      translateX = e.touches[0].clientX - startX;
      translateY = e.touches[0].clientY - startY;
      applyTransform();
    } else if (e.touches.length === 2) {
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      if (lastTouchDistance > 0) {
        const delta = currentDistance - lastTouchDistance;
        const newScale = Math.max(0.5, Math.min(5, scale + delta * 0.01));
        
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        const rect = currentMedia.getBoundingClientRect();
        const relX = (midX - rect.left) / currentMedia.offsetWidth;
        const relY = (midY - rect.top) / currentMedia.offsetHeight;
        
        const originalWidth = currentMedia.offsetWidth / scale;
        const originalHeight = currentMedia.offsetHeight / scale;
        
        if (newScale > scale) {
          translateX -= (newScale - scale) * originalWidth * (relX - 0.5);
          translateY -= (newScale - scale) * originalHeight * (relY - 0.5);
        } else {
          translateX += (scale - newScale) * originalWidth * (relX - 0.5);
          translateY += (scale - newScale) * originalHeight * (relY - 0.5);
        }
        
        scale = newScale;
        applyTransform();
      }
      
      lastTouchDistance = currentDistance;
    }
  }
  
  // Touch end handler
  function handleTouchEnd() {
    isDragging = false;
    lastTouchDistance = 0;
  }
  
  // Apply transform to current media
  function applyTransform() {
    if (!currentMedia) return;
    
    const maxTranslateX = (scale - 1) * currentMedia.offsetWidth / 2;
    const maxTranslateY = (scale - 1) * currentMedia.offsetHeight / 2;
    
    if (scale > 1) {
      translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX));
      translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY));
    } else {
      translateX = 0;
      translateY = 0;
    }
    
    currentMedia.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }
  
  // Reset transform
  function resetTransform() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
  }
  
  // Close popup
  function closePopup() {
    popup.style.display = 'none';
    document.body.style.overflow = '';
    popupContent.classList.remove('iframe-mode');
    
    // Clean up any media
    if (isVideo && currentMedia) {
      currentMedia.pause();
    }
    
    // Clear the popup content to stop any iframe playback
    while (popupContent.firstChild) {
      popupContent.removeChild(popupContent.firstChild);
    }
  }
  
  // Detect content type for project cards
  const projectCards = document.querySelectorAll('.project-card');
  
  projectCards.forEach(card => {
    const container = card.querySelector('.project-image-container');
    const projectTitle = card.querySelector('.project-title').textContent;
    
    // Check for video elements or add click handlers to images
    if (container) {
      // For existing images
      const img = container.querySelector('.zoom-image');
      if (img) {
        container.addEventListener('click', function(e) {
          if (isDragging) return;
          
          // Check for different media types using data attributes
          const videoSrc = img.getAttribute('data-video-src');
          const embedKey = img.getAttribute('data-embed-key');
          
          if (embedKey) {
            openPopup(null, projectTitle, 'iframe', embedKey);
          } else if (videoSrc) {
            openPopup(videoSrc, projectTitle, 'video');
          } else {
            openPopup(img.src, projectTitle, 'image');
          }
        });
      }
    }
  });
  
  // Button event listeners
  closeBtn.addEventListener('click', closePopup);
  popup.addEventListener('click', function(e) {
    if (e.target === popup || e.target === popupContent) {
      closePopup();
    }
  });
  
  zoomInBtn.addEventListener('click', function() {
    if (isIframe) return;
    scale = Math.min(5, scale + 0.5);
    applyTransform();
  });
  
  zoomOutBtn.addEventListener('click', function() {
    if (isIframe) return;
    scale = Math.max(0.5, scale - 0.5);
    applyTransform();
  });
  
  resetBtn.addEventListener('click', function() {
    if (isIframe) return;
    resetTransform();
  });
  
  // Global mouse move and up
  window.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    applyTransform();
  });
  
  window.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      if (currentMedia) {
        currentMedia.style.cursor = 'grab';
      }
    }
  });
  
  // Keyboard controls
  window.addEventListener('keydown', function(e) {
    if (popup.style.display === 'block') {
      switch (e.key) {
        case 'Escape':
          closePopup();
          break;
        case '+':
        case '=':
          if (!isIframe) {
            scale = Math.min(5, scale + 0.2);
            applyTransform();
          }
          break;
        case '-':
          if (!isIframe) {
            scale = Math.max(0.5, scale - 0.2);
            applyTransform();
          }
          break;
        case '0':
          if (!isIframe) {
            resetTransform();
          }
          break;
        case 'ArrowUp':
          if (!isIframe) {
            translateY += 50;
            applyTransform();
          }
          break;
        case 'ArrowDown':
          if (!isIframe) {
            translateY -= 50;
            applyTransform();
          }
          break;
        case 'ArrowLeft':
          if (!isIframe) {
            translateX += 50;
            applyTransform();
          }
          break;
        case 'ArrowRight':
          if (!isIframe) {
            translateX -= 50;
            applyTransform();
          }
          break;
      }
    }
  });
});