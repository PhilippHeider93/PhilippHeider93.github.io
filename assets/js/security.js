(function() {
  // Only run security checks if we detect signs of a crawler
  const suspiciousUserAgents = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
    'yandexbot', 'sogou', 'exabot', 'facebookexternalhit', 'ia_archiver'
  ];
  
  const userAgent = navigator.userAgent.toLowerCase();
  const potentialBot = suspiciousUserAgents.some(bot => userAgent.includes(bot));
  
  // For potential bots, we also check iframe and referrer conditions
  if (potentialBot) {
    const loadedInIframe = window.location !== window.parent.location;
    const hasInvalidReferrer = document.referrer && 
                               document.referrer.indexOf(window.location.hostname) === -1;
    
    if (loadedInIframe || hasInvalidReferrer) {
      console.error('Unauthorized access');
      throw new Error('Unauthorized access');
    }
  }
  
  // Additional protection against automated scraping
  // Detect headless browsers or automation tools
  const isHeadless = /HeadlessChrome/.test(navigator.userAgent) || 
                     navigator.webdriver || 
                     window.callPhantom || 
                     window._phantom || 
                     window.phantom;
  
  if (isHeadless) {
    console.error('Automated browser detected');
    throw new Error('Automated access not allowed');
  }
})();