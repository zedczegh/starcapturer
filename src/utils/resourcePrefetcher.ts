
/**
 * Resource prefetcher to optimize loading of commonly used assets
 */

import { getCachedItem, setCachedItem } from './optimizedCache';

// Track prefetch status to avoid duplicate requests
const prefetchedResources = new Set<string>();

/**
 * Prefetch critical resources needed for app startup
 */
export function prefetchCriticalResources(): void {
  // Common API endpoints to prefetch
  prefetchResource('https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current=cloud_cover&timezone=auto');
  
  // Prefetch common location data
  prefetchCommonLocations();
}

/**
 * Prefetch a specific resource URL
 */
export function prefetchResource(url: string, options?: RequestInit): Promise<any> {
  // Skip if already prefetched
  if (prefetchedResources.has(url)) {
    return Promise.resolve();
  }
  
  const cacheKey = `prefetch:${url}`;
  const cachedData = getCachedItem(cacheKey);
  
  if (cachedData) {
    prefetchedResources.add(url);
    return Promise.resolve(cachedData);
  }
  
  return fetch(url, { 
    ...options,
    // Use low priority to avoid blocking critical resources
    priority: 'low' as any,
    // Cache credentials for authenticated endpoints
    credentials: options?.credentials || 'same-origin'
  })
  .then(res => res.json())
  .then(data => {
    // Add to cache with a 10-minute TTL
    setCachedItem(cacheKey, data, 10 * 60 * 1000);
    prefetchedResources.add(url);
    return data;
  })
  .catch(err => {
    console.warn(`Failed to prefetch ${url}:`, err);
    return null;
  });
}

/**
 * Prefetch data for commonly accessed locations
 */
function prefetchCommonLocations(): void {
  // Beijing
  prefetchLocationData(39.9042, 116.4074);
  
  // Shanghai  
  prefetchLocationData(31.2304, 121.4737);

  // Additional locations can be added based on user access patterns
}

/**
 * Prefetch data for a specific location
 */
export function prefetchLocationData(latitude: number, longitude: number): void {
  // Weather data
  prefetchResource(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=cloud_cover,temperature_2m&timezone=auto`);
  
  // Bortle scale data (if applicable)
  // Add other resources needed for location rendering
}

/**
 * Create image preloader for improved UI loading
 */
export function preloadImages(imageSources: string[]): void {
  // Skip if no images or not in browser
  if (!imageSources.length || typeof window === 'undefined') return;
  
  // Create a hidden div for preload elements
  const preloadContainer = document.createElement('div');
  preloadContainer.style.display = 'none';
  document.body.appendChild(preloadContainer);
  
  // Create and load each image
  for (const src of imageSources) {
    if (prefetchedResources.has(`image:${src}`)) continue;
    
    const img = new Image();
    img.src = src;
    prefetchedResources.add(`image:${src}`);
    preloadContainer.appendChild(img);
  }
  
  // Remove container after a delay
  setTimeout(() => {
    if (preloadContainer.parentNode) {
      preloadContainer.parentNode.removeChild(preloadContainer);
    }
  }, 5000);
}

// Run prefetcher during idle time
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  (window as any).requestIdleCallback(() => {
    prefetchCriticalResources();
  });
} else if (typeof window !== 'undefined') {
  // Fallback for browsers without requestIdleCallback
  setTimeout(() => {
    prefetchCriticalResources();
  }, 1000);
}
