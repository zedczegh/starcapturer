/**
 * Performance utilities to optimize component rendering and data loading
 */

// Cache for memoizing expensive calculations
const memoCache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * Memoize an expensive function result with a time-to-live
 * 
 * @param fn Function to memoize
 * @param key Cache key
 * @param ttl Time to live in ms (default: 5 minutes)
 * @returns Memoized function result
 */
export function memoize<T>(
  fn: () => T, 
  key: string,
  ttl: number = CACHE_TTL
): T {
  const now = Date.now();
  const cached = memoCache.get(key);
  
  // If we have a valid cached result, return it
  if (cached && now - cached.timestamp < ttl) {
    return cached.value;
  }
  
  // Otherwise, call the function and cache the result
  const result = fn();
  memoCache.set(key, { value: result, timestamp: now });
  return result;
}

/**
 * Clear a specific key from the memoize cache
 * 
 * @param key Cache key to clear
 */
export function clearMemoCache(key: string): void {
  memoCache.delete(key);
}

/**
 * Clear all memoize cache
 */
export function clearAllMemoCache(): void {
  memoCache.clear();
}

/**
 * Debounce a function call
 * 
 * @param fn Function to debounce
 * @param delay Delay in ms
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function(...args: Parameters<T>): void {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function call
 * 
 * @param fn Function to throttle
 * @param limit Time limit in ms
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          const currentArgs = lastArgs;
          lastArgs = null;
          fn(...currentArgs);
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Measure execution time of a function
 * 
 * @param fn Function to measure
 * @param label Label for console output
 * @returns Function result
 */
export function measureExecutionTime<T>(fn: () => T, label: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

/**
 * Check if code is running on the server side
 * 
 * @returns True if running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if the device is a mobile device
 * 
 * @returns True if mobile device
 */
export function isMobileDevice(): boolean {
  if (isServer()) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get the viewport dimensions
 * 
 * @returns Object with width and height
 */
export function getViewportDimensions(): { width: number; height: number } {
  if (isServer()) return { width: 0, height: 0 };
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}
