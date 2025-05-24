// media-popup.js - Updated embed handling for OneDrive

document.addEventListener('DOMContentLoaded', function() {
  const popup = document.getElementById('imagePopup');
  const popupContent = document.querySelector('.popup-image-container');
  const popupTitle = document.querySelector('.popup-title');
  const closeBtn = document.querySelector('.popup-close');
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const resetBtn = document.getElementById('resetView');
  const popupHelp = document.querySelector('.popup-help');
  
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
  
  // Slide navigation variables
  let slides = [];
  let currentSlideIndex = 0;
  let isSlideshow = false;
  
  // Store OneDrive embed URLs - using the direct URLs from the instructions
  const embedMap = {
    'synably': 'https://1drv.ms/v/c/b14276315fd21aa5/IQQFnsL-v24gQKpre7kmJgzyAeKBsNNbIS9jCmj4fHZlhBQ',
    // PowerPoint presentation (16:9 format)
    'spiegltec-pdf1': 'https://1drv.ms/p/c/b14276315fd21aa5/IQR4GCHoVaEqRqa_E01h6tRHAZlyJXfBIOcc_hLpI6vEXLU',
    // Document (DIN A4 format)
    'spiegltec-pdf2': 'https://1drv.ms/b/c/b14276315fd21aa5/IQRXo82C-0PVRLeQxcZ7xgUFAewNdVMIahjLlI40d7l4lXI'
  };
  
  // Update help text based on mode
  function updateHelpText() {
    if (isSlideshow) {
      popupHelp.innerHTML = '<span style="margin-right: 20px;">← → Navigate slides</span><span>ESC to close</span>';
      popupHelp.style.display = 'block';
    } else if (isIframe) {
      popupHelp.innerHTML = '<span>ESC to close</span>';
      popupHelp.style.display = 'block';
    } else {
      popupHelp.innerHTML = 'Click and drag to move • Scroll to zoom';
      popupHelp.style.display = 'block';
    }
  }
  
  // Initialize popup with either image, video, iframe, or slideshow
  function openPopup(src, title, type = 'image', embedKey = null, slidesData = null) {
    popupTitle.textContent = title;
    isVideo = type === 'video';
    isIframe = type === 'iframe';
    isSlideshow = type === 'slideshow';
    
    // Clear previous content
    while (popupContent.firstChild) {
      popupContent.removeChild(popupContent.firstChild);
    }
    
    // Reset transform values
    scale = 1;
    translateX = 0;
    translateY = 0;
    currentMedia = null;
    
    if (isSlideshow && slidesData) {
      // Initialize slideshow
      slides = slidesData;
      currentSlideIndex = 0;
      
      // Create slide container
      const slideContainer = document.createElement('div');
      slideContainer.className = 'slide-container';
      slideContainer.style.cssText = 'width: 100%; height: 100%; position: relative; display: flex; align-items: center; justify-content: center;';
      
      // Create slide content wrapper
      const slideWrapper = document.createElement('div');
      slideWrapper.className = 'slide-wrapper';
      slideWrapper.style.cssText = 'width: 100%; height: 100%; position: relative;';
      slideContainer.appendChild(slideWrapper);
      
      // Create navigation arrows
      const prevBtn = document.createElement('div');
      prevBtn.className = 'slide-nav prev';
      prevBtn.innerHTML = '❮';
      prevBtn.style.cssText = 'position: absolute; left: 20px; top: 50%; transform: translateY(-50%); font-size: 2rem; color: #fff; cursor: pointer; padding: 10px 15px; background: rgba(48, 76, 253, 0.7); border-radius: 4px; z-index: 100; user-select: none;';
      prevBtn.onmouseenter = function() { this.style.background = 'rgba(48, 76, 253, 0.9)'; };
      prevBtn.onmouseleave = function() { this.style.background = 'rgba(48, 76, 253, 0.7)'; };
      prevBtn.onclick = function(e) {
        e.stopPropagation();
        changeSlide(-1);
      };
      
      const nextBtn = document.createElement('div');
      nextBtn.className = 'slide-nav next';
      nextBtn.innerHTML = '❯';
      nextBtn.style.cssText = 'position: absolute; right: 20px; top: 50%; transform: translateY(-50%); font-size: 2rem; color: #fff; cursor: pointer; padding: 10px 15px; background: rgba(48, 76, 253, 0.7); border-radius: 4px; z-index: 100; user-select: none;';
      nextBtn.onmouseenter = function() { this.style.background = 'rgba(48, 76, 253, 0.9)'; };
      nextBtn.onmouseleave = function() { this.style.background = 'rgba(48, 76, 253, 0.7)'; };
      nextBtn.onclick = function(e) {
        e.stopPropagation();
        changeSlide(1);
      };
      
      // Create keyboard hints
      const keyboardHints = document.createElement('div');
      keyboardHints.className = 'keyboard-hints';
      keyboardHints.style.cssText = 'position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); display: flex; gap: 15px; z-index: 100; background: rgba(0, 0, 0, 0.7); padding: 10px 20px; border-radius: 6px;';
      
      const leftKeyHint = document.createElement('div');
      leftKeyHint.style.cssText = 'display: flex; align-items: center; gap: 8px; color: #fff; font-size: 0.9rem;';
      leftKeyHint.innerHTML = '<span style="background: #444; padding: 4px 8px; border-radius: 4px; font-family: monospace;">←</span><span>Previous</span>';
      
      const rightKeyHint = document.createElement('div');
      rightKeyHint.style.cssText = 'display: flex; align-items: center; gap: 8px; color: #fff; font-size: 0.9rem;';
      rightKeyHint.innerHTML = '<span style="background: #444; padding: 4px 8px; border-radius: 4px; font-family: monospace;">→</span><span>Next</span>';
      
      keyboardHints.appendChild(leftKeyHint);
      keyboardHints.appendChild(rightKeyHint);
      
      // Create indicators
      const indicators = document.createElement('div');
      indicators.className = 'slide-indicators';
      indicators.style.cssText = 'position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 100;';
      
      slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'slide-dot';
        dot.style.cssText = 'width: 10px; height: 10px; border-radius: 50%; background: rgba(255, 255, 255, 0.5); cursor: pointer; transition: all 0.3s;';
        if (index === 0) {
          dot.style.background = '#304CFD';
          dot.style.width = '24px';
          dot.style.borderRadius = '5px';
        }
        dot.onclick = function(e) {
          e.stopPropagation();
          goToSlide(index);
        };
        indicators.appendChild(dot);
      });
      
      // Add slide counter
      const slideCounter = document.createElement('div');
      slideCounter.className = 'slide-counter';
      slideCounter.style.cssText = 'position: absolute; top: 20px; right: 20px; background: rgba(0, 0, 0, 0.7); color: #fff; padding: 5px 15px; border-radius: 20px; font-size: 0.9rem; z-index: 100;';
      slideCounter.textContent = `${currentSlideIndex + 1} / ${slides.length}`;
      
      slideContainer.appendChild(prevBtn);
      slideContainer.appendChild(nextBtn);
      slideContainer.appendChild(keyboardHints);
      slideContainer.appendChild(indicators);
      slideContainer.appendChild(slideCounter);
      popupContent.appendChild(slideContainer);
      
      // Show first slide
      showSlide(0);
      
      // Hide zoom controls for slideshow
      const zoomControls = document.querySelector('.popup-controls');
      zoomControls.style.display = 'none';
      
    } else {
      // Original single media logic
      const zoomControls = document.querySelector('.popup-controls');
      zoomControls.style.display = isIframe ? 'none' : 'flex';
      
      if (isIframe && embedKey) {
        const embedUrl = embedMap[embedKey];
        if (!embedUrl) {
          console.error('Embed URL not found for key:', embedKey);
          return;
        }
        
        createIframe(embedUrl);
        
      } else if (isVideo) {
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
      
      if (!isIframe) {
        resetTransform();
        setupMediaInteraction(currentMedia);
      }
    }
    
    // Update help text
    updateHelpText();
    
    popup.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  
  // Create iframe helper - properly handle OneDrive URLs
  function createIframe(embedUrl, isSlideshow = false) {
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'iframe-container';
    iframeContainer.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;';
    
    // Create wrapper for better styling
    const iframeWrapper = document.createElement('div');
    iframeWrapper.style.cssText = 'width: 90%; height: 90%; max-width: 1200px; max-height: 800px; background: #f5f5f5; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); overflow: hidden; position: relative;';
    
    const iframe = document.createElement('iframe');
    
    // Check if it's a OneDrive short URL and convert it
    if (embedUrl.includes('1drv.ms')) {
      // Use the URL as-is for 1drv.ms links
      iframe.src = embedUrl;
    } else {
      // Use other embed URLs as-is
      iframe.src = embedUrl;
    }
    
    // Set iframe attributes
    iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'true');
    
    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #666; font-size: 1.2rem;';
    loadingIndicator.textContent = 'Loading document...';
    
    iframeWrapper.appendChild(loadingIndicator);
    iframeWrapper.appendChild(iframe);
    iframeContainer.appendChild(iframeWrapper);
    
    // Remove loading indicator when iframe loads
    iframe.onload = function() {
      if (loadingIndicator.parentNode) {
        loadingIndicator.remove();
      }
    };
    
    // Handle iframe errors
    iframe.onerror = function() {
      loadingIndicator.textContent = 'Unable to load document';
      loadingIndicator.style.color = '#d32f2f';
    };
    
    if (!isSlideshow) {
      popupContent.appendChild(iframeContainer);
      popupContent.classList.add('iframe-mode');
    }
    
    return iframeContainer;
  }
  
  // Slideshow functions
  function showSlide(index) {
    const slideWrapper = popupContent.querySelector('.slide-wrapper');
    if (!slideWrapper) return;
    
    const slide = slides[index];
    
    // Clear previous slide
    while (slideWrapper.firstChild) {
      slideWrapper.removeChild(slideWrapper.firstChild);
    }
    
    const slideContent = document.createElement('div');
    slideContent.className = 'slide-content';
    slideContent.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;';
    
    if (slide.type === 'iframe') {
      const embedUrl = embedMap[slide.embedKey];
      if (embedUrl) {
        // Create wrapper for iframe slides
        const iframeWrapper = document.createElement('div');
        iframeWrapper.style.cssText = 'width: 90%; height: 90%; max-width: 1200px; max-height: 800px; background: #f5f5f5; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); overflow: hidden; position: relative;';
        
        const iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', 'true');
        
        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #666; font-size: 1.2rem;';
        loadingIndicator.textContent = 'Loading document...';
        
        iframeWrapper.appendChild(loadingIndicator);
        iframeWrapper.appendChild(iframe);
        
        iframe.onload = function() {
          if (loadingIndicator.parentNode) {
            loadingIndicator.remove();
          }
        };
        
        slideContent.appendChild(iframeWrapper);
      }
    } else {
      const img = document.createElement('img');
      img.src = slide.src;
      img.alt = slide.alt || '';
      img.style.cssText = 'max-height: 85%; max-width: 85%; box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);';
      slideContent.appendChild(img);
      currentMedia = img;
      resetTransform();
      setupMediaInteraction(img);
    }
    
    slideWrapper.appendChild(slideContent);
    updateIndicators(index);
    updateSlideCounter(index);
  }
  
  function changeSlide(direction) {
    currentSlideIndex += direction;
    if (currentSlideIndex >= slides.length) currentSlideIndex = 0;
    if (currentSlideIndex < 0) currentSlideIndex = slides.length - 1;
    showSlide(currentSlideIndex);
  }
  
  function goToSlide(index) {
    currentSlideIndex = index;
    showSlide(currentSlideIndex);
  }
  
  function updateIndicators(activeIndex) {
    const dots = popupContent.querySelectorAll('.slide-dot');
    dots.forEach((dot, index) => {
      if (index === activeIndex) {
        dot.style.background = '#304CFD';
        dot.style.width = '24px';
        dot.style.borderRadius = '5px';
      } else {
        dot.style.background = 'rgba(255, 255, 255, 0.5)';
        dot.style.width = '10px';
        dot.style.borderRadius = '50%';
      }
    });
  }
  
  function updateSlideCounter(index) {
    const counter = popupContent.querySelector('.slide-counter');
    if (counter) {
      counter.textContent = `${index + 1} / ${slides.length}`;
    }
  }
  
  // Setup interaction events for current media (image or video)
  function setupMediaInteraction(media) {
    if (!media) return;
    media.addEventListener('wheel', handleWheel);
    media.addEventListener('mousedown', handleMouseDown);
    media.addEventListener('touchstart', handleTouchStart);
    media.addEventListener('touchmove', handleTouchMove);
    media.addEventListener('touchend', handleTouchEnd);
    media.addEventListener('dblclick', resetTransform);
  }
  
  // Event handlers remain the same...
  function handleWheel(e) {
    if (!currentMedia || isSlideshow) return;
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
  
  function handleMouseDown(e) {
    if (!currentMedia || isSlideshow) return;
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    currentMedia.style.cursor = 'grabbing';
  }
  
  function handleTouchStart(e) {
    if (!currentMedia || isSlideshow) return;
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
  
  function handleTouchMove(e) {
    if (!currentMedia || isSlideshow) return;
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
  
  function handleTouchEnd() {
    isDragging = false;
    lastTouchDistance = 0;
  }
  
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
  
  function resetTransform() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
  }
  
  function closePopup() {
    popup.style.display = 'none';
    document.body.style.overflow = '';
    popupContent.classList.remove('iframe-mode');
    
    if (isVideo && currentMedia) {
      currentMedia.pause();
    }
    
    while (popupContent.firstChild) {
      popupContent.removeChild(popupContent.firstChild);
    }
    
    // Reset all states
    isSlideshow = false;
    isVideo = false;
    isIframe = false;
    slides = [];
    currentSlideIndex = 0;
    scale = 1;
    translateX = 0;
    translateY = 0;
    currentMedia = null;
    
    // Reset zoom controls visibility and help text
    const zoomControls = document.querySelector('.popup-controls');
    zoomControls.style.display = 'flex';
    popupHelp.innerHTML = 'Click and drag to move • Scroll to zoom';
  }
  
  // Setup click handlers for all zoom containers
  document.querySelectorAll('.zoom-container').forEach(container => {
    container.addEventListener('click', function(e) {
      if (isDragging) return;
      e.preventDefault();
      e.stopPropagation();
      
      const projectCard = this.closest('.project-card');
      const projectTitle = projectCard.querySelector('.project-title').textContent;
      
      // Check if this is SpieglTec project (has slideshow)
      if (projectTitle.includes('SpieglTec')) {
        const slides = [
          { type: 'iframe', embedKey: 'spiegltec-pdf1', alt: 'PowerPoint Presentation' },
          { type: 'iframe', embedKey: 'spiegltec-pdf2', alt: 'Documentation' },
          { type: 'image', src: 'assets/img/spiegltec/1.JPG', alt: 'Project Overview' },
          { type: 'image', src: 'assets/img/spiegltec/2.JPG', alt: 'Project Management Hub' },
          { type: 'image', src: 'assets/img/spiegltec/3.JPG', alt: 'Knowledge Hub' },
          { type: 'image', src: 'assets/img/spiegltec/4.JPG', alt: 'Workflow Automation' }
        ];
        
        openPopup(null, projectTitle, 'slideshow', null, slides);
      } else {
        // Check for other media types
        const img = this.querySelector('.zoom-image');
        if (img) {
          const embedKey = img.getAttribute('data-embed-key');
          
          if (embedKey) {
            openPopup(null, projectTitle, 'iframe', embedKey);
          } else {
            openPopup(img.src, projectTitle, 'image');
          }
        }
      }
    });
  });
  
  // Button event listeners
  closeBtn.addEventListener('click', closePopup);
  popup.addEventListener('click', function(e) {
    if (e.target === popup) {
      closePopup();
    }
  });
  
  zoomInBtn.addEventListener('click', function() {
    if (isIframe || isSlideshow || !currentMedia) return;
    scale = Math.min(5, scale + 0.5);
    applyTransform();
  });
  
  zoomOutBtn.addEventListener('click', function() {
    if (isIframe || isSlideshow || !currentMedia) return;
    scale = Math.max(0.5, scale - 0.5);
    applyTransform();
  });
  
  resetBtn.addEventListener('click', function() {
    if (isIframe || isSlideshow || !currentMedia) return;
    resetTransform();
  });
  
  // Global mouse move and up
  window.addEventListener('mousemove', function(e) {
    if (!isDragging || !currentMedia) return;
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
  
  // Keyboard controls with visual feedback
  window.addEventListener('keydown', function(e) {
    if (popup.style.display === 'block') {
      switch (e.key) {
        case 'Escape':
          closePopup();
          break;
        case 'ArrowLeft':
          if (isSlideshow) {
            e.preventDefault();
            changeSlide(-1);
            // Visual feedback for keyboard navigation
            const prevBtn = popupContent.querySelector('.slide-nav.prev');
            if (prevBtn) {
              prevBtn.style.background = 'rgba(48, 76, 253, 1)';
              setTimeout(() => {
                prevBtn.style.background = 'rgba(48, 76, 253, 0.7)';
              }, 200);
            }
          } else if (!isIframe && currentMedia) {
            translateX += 50;
            applyTransform();
          }
          break;
        case 'ArrowRight':
          if (isSlideshow) {
            e.preventDefault();
            changeSlide(1);
            // Visual feedback for keyboard navigation
            const nextBtn = popupContent.querySelector('.slide-nav.next');
            if (nextBtn) {
              nextBtn.style.background = 'rgba(48, 76, 253, 1)';
              setTimeout(() => {
                nextBtn.style.background = 'rgba(48, 76, 253, 0.7)';
              }, 200);
            }
          } else if (!isIframe && currentMedia) {
            translateX -= 50;
            applyTransform();
          }
          break;
        case '+':
        case '=':
          if (!isIframe && !isSlideshow && currentMedia) {
            scale = Math.min(5, scale + 0.2);
            applyTransform();
          }
          break;
        case '-':
          if (!isIframe && !isSlideshow && currentMedia) {
            scale = Math.max(0.5, scale - 0.2);
            applyTransform();
          }
          break;
        case '0':
          if (!isIframe && !isSlideshow && currentMedia) {
            resetTransform();
          }
          break;
        case 'ArrowUp':
          if (!isIframe && !isSlideshow && currentMedia) {
            translateY += 50;
            applyTransform();
          }
          break;
        case 'ArrowDown':
          if (!isIframe && !isSlideshow && currentMedia) {
            translateY -= 50;
            applyTransform();
          }
          break;
      }
    }
  });
});