
/**
 * Image optimization utility to improve loading performance
 */

// Track which images have been preloaded to avoid duplicate work
const preloadedImages = new Set<string>();

// Maximum number of images to preload concurrently
const MAX_CONCURRENT_PRELOADS = 5;
let activePreloads = 0;
const preloadQueue: Array<() => void> = [];

/**
 * Preload an image to improve render performance
 * @param src Image source URL
 * @param priority Priority level (high = load immediately, low = queue)
 * @returns Promise resolving when preload is complete
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'low'): Promise<void> {
  // Skip if already preloaded or currently loading
  if (preloadedImages.has(src)) {
    return Promise.resolve();
  }
  
  preloadedImages.add(src); // Mark as preloaded
  
  const preloadFunc = () => {
    return new Promise<void>((resolve) => {
      activePreloads++;
      
      const img = new Image();
      img.onload = () => {
        activePreloads--;
        processQueue();
        resolve();
      };
      img.onerror = () => {
        activePreloads--;
        preloadedImages.delete(src); // Remove failed image from preloaded set
        processQueue();
        resolve();
      };
      img.src = src;
    });
  };
  
  // High priority images load immediately regardless of queue
  if (priority === 'high' || activePreloads < MAX_CONCURRENT_PRELOADS) {
    return preloadFunc();
  }
  
  // Queue low priority images
  return new Promise<void>((resolve) => {
    preloadQueue.push(() => {
      preloadFunc().then(resolve);
    });
  });
}

/**
 * Process the preload queue
 */
function processQueue() {
  while (activePreloads < MAX_CONCURRENT_PRELOADS && preloadQueue.length > 0) {
    const nextPreload = preloadQueue.shift();
    if (nextPreload) nextPreload();
  }
}

/**
 * Batch preload multiple images
 * @param sources Array of image URLs to preload
 */
export function batchPreloadImages(sources: string[]): void {
  // Filter out already preloaded images
  const newSources = sources.filter(src => !preloadedImages.has(src));
  
  // Queue preloads with a slight delay between batches
  let batchIndex = 0;
  const batchSize = 3; // Process images in small batches
  
  function loadNextBatch() {
    const batch = newSources.slice(batchIndex, batchIndex + batchSize);
    batchIndex += batchSize;
    
    if (batch.length === 0) return;
    
    batch.forEach(src => preloadImage(src));
    
    // Schedule next batch with a slight delay
    if (batchIndex < newSources.length) {
      setTimeout(loadNextBatch, 100);
    }
  }
  
  loadNextBatch();
}

/**
 * Optimize and preload images for a route
 * @param route The current route
 */
export function preloadImagesForRoute(route: string): void {
  // Define common assets to preload based on routes
  const routeToImages: Record<string, string[]> = {
    '/photo-points': [
      '/assets/marker-pin.svg', 
      '/assets/user-location.svg'
    ],
    '/profile': [
      '/assets/default-avatar.png'
    ]
  };
  
  // Find images for this route
  const imagesToPreload = routeToImages[route] || [];
  
  if (imagesToPreload.length > 0) {
    batchPreloadImages(imagesToPreload);
  }
}

/**
 * Add lazy loading to all images in a container
 * Use as a ref for container elements
 */
export function lazyLoadContainerRef(node: HTMLElement | null): void {
  if (!node || typeof IntersectionObserver !== 'function') return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const container = entry.target;
        const images = container.querySelectorAll('img[data-src]');
        
        images.forEach(img => {
          const src = img.getAttribute('data-src');
          if (src) {
            img.setAttribute('src', src);
            img.removeAttribute('data-src');
          }
        });
        
        // Disconnect after handling
        if (images.length > 0) {
          observer.disconnect();
        }
      }
    });
  }, { threshold: 0.1 });
  
  observer.observe(node);
}

// Dynamically import polyfills for older browsers if needed
function loadPolyfills(): Promise<void> {
  if (!('IntersectionObserver' in window)) {
    // Using dynamic import instead of static import to avoid type issues
    return import('intersection-observer').then(() => {
      console.log("IntersectionObserver polyfill loaded");
    });
  }
  return Promise.resolve();
}

// Initialize polyfills
loadPolyfills();
