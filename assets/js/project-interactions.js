// project-interactions.js - Handles thumbnail zoom/pan and slideshow effects

document.addEventListener('DOMContentLoaded', function() {
  // Zoom and pan functionality for thumbnails
  const zoomContainers = document.querySelectorAll('.zoom-container');
  
  zoomContainers.forEach(container => {
    const zoomImage = container.querySelector('.zoom-image');
    let isDragging = false;
    let currentZoom = 1;
    let translateX = 0;
    let translateY = 0;
    let lastTranslateX = 0, lastTranslateY = 0;
    
    const minZoom = 1;
    const maxZoom = 3;
    
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const delta = -Math.sign(e.deltaY);
      const zoomFactor = 0.1; 
      const newZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom + delta * zoomFactor));
      
      if (currentZoom === minZoom && delta < 0) {
        return;
      }
      
      const mouseXPercent = mouseX / container.offsetWidth;
      const mouseYPercent = mouseY / container.offsetHeight;
      
      const newTranslateX = translateX - ((newZoom - currentZoom) * container.offsetWidth * mouseXPercent);
      const newTranslateY = translateY - ((newZoom - currentZoom) * container.offsetHeight * mouseYPercent);
      
      currentZoom = newZoom;
      translateX = newTranslateX;
      translateY = newTranslateY;
      
      updateTransform();
    });
    
    container.addEventListener('mousedown', (e) => {
      if (currentZoom > minZoom) {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        container.style.cursor = 'grabbing';
      }
    });
    
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      
      updateTransform();
    });
    
    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        lastTranslateX = translateX;
        lastTranslateY = translateY;
        container.style.cursor = 'grab';
      }
    });
    
    container.addEventListener('mouseleave', () => {
      isDragging = false;
      if (currentZoom === minZoom) {
        translateX = 0;
        translateY = 0;
      }
      updateTransform();
    });
    
    container.addEventListener('dblclick', () => {
      currentZoom = minZoom;
      translateX = 0;
      translateY = 0;
      updateTransform();
    });
    
    function updateTransform() {
      const maxTranslateX = (currentZoom - 1) * container.offsetWidth / 2;
      const maxTranslateY = (currentZoom - 1) * container.offsetHeight / 2;
      
      translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX));
      translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY));
      
      zoomImage.style.transform = `scale(${currentZoom}) translate(${translateX / currentZoom}px, ${translateY / currentZoom}px)`;
    }
  });
  
  // Slideshow functionality for project thumbnails
  const containers = document.querySelectorAll('.project-image-container');
  
  containers.forEach((container, index) => {
    if (index >= 2) {
      const slideshow = container.querySelector('.image-slideshow');
      if (!slideshow) return;
      
      const slides = slideshow.querySelectorAll('.slide');
      let activeIndex = 0;
      let slideshowInterval;
      
      if (slides.length > 0) {
        slides[0].classList.add('active');
      }
      
      function nextSlide() {
        slides[activeIndex].classList.remove('active');
        activeIndex = (activeIndex + 1) % slides.length;
        slides[activeIndex].classList.add('active');
      }
      
      container.addEventListener('mouseenter', () => {
        if (slides.length > 1) {
          slideshowInterval = setInterval(nextSlide, 1500);
        }
      });
      
      container.addEventListener('mouseleave', () => {
        clearInterval(slideshowInterval);
        
        slides.forEach(slide => slide.classList.remove('active'));
        activeIndex = 0;
        slides[0].classList.add('active');
      });
    }
  });
});