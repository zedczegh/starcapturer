
/**
 * Configuration for SIQS caching system
 * Optimized for mobile performance
 */

// Standard cache duration: 10 minutes
const DEFAULT_CACHE_DURATION = 10 * 60 * 1000; 

// Mobile-optimized cache duration: 15 minutes (longer to reduce API calls)
const MOBILE_CACHE_DURATION = 15 * 60 * 1000;

// Auto cleanup interval: 2 minutes
export const AUTO_CLEANUP_INTERVAL = 2 * 60 * 1000;

// Get the appropriate cache duration based on platform
export function getCacheDuration(): number {
  // Detect if running on mobile
  const isMobile = typeof window !== 'undefined' && 
    (window.innerWidth < 768 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  
  return isMobile ? MOBILE_CACHE_DURATION : DEFAULT_CACHE_DURATION;
}

// Generate a consistent location key for caching
export function getLocationKey(latitude: number, longitude: number): string {
  // Use 4 decimal places for location (~11m accuracy)
  const latKey = latitude.toFixed(4);
  const lngKey = longitude.toFixed(4);
  return `${latKey},${lngKey}`;
}

// Configuration for optimizing network requests
export const networkConfig = {
  // Minimum time between requests to the same endpoint (ms)
  rateLimitInterval: 500,
  
  // Maximum concurrent requests
  maxConcurrentRequests: 3,
  
  // Request timeout (ms)
  timeout: 8000,
  
  // Network conditions detection
  detectSlowConnection: true,
  
  // Reduce quality on slow connections
  adaptToNetworkSpeed: true
};

// Mobile-specific optimizations
export const mobileOptimizations = {
  // Reduce animation complexity
  reduceAnimations: true,
  
  // Use compact UI elements
  useCompactUI: true,
  
  // Prioritize essential API calls
  deprioritizeNonEssential: true,
  
  // Lazy load images and heavy components
  enableLazyLoading: true
};

// Export a function to detect if we should apply mobile optimizations
export function shouldApplyMobileOptimizations(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check screen width
  const isMobileWidth = window.innerWidth < 768;
  
  // Check for mobile user agent
  const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  // Check for touch capability
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Apply mobile optimizations if any of these are true
  return isMobileWidth || isMobileAgent || isTouch;
}
