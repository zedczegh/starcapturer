
/**
 * Safely store data in localStorage with error handling for quota exceeded
 * @param key Storage key
 * @param value Value to store
 * @param fallbackAction Function to call if storage fails
 * @returns boolean indicating success
 */
export function safeLocalStorageSet(
  key: string, 
  value: any, 
  fallbackAction?: () => void
): boolean {
  try {
    // For large objects, use compression or truncate if needed
    const stringValue = JSON.stringify(value);
    
    // If string is too large (>2MB), it will likely fail
    if (stringValue.length > 2000000) {
      console.warn(`Storage value for ${key} is very large (${(stringValue.length/1024/1024).toFixed(2)}MB), may fail`);
    }
    
    localStorage.setItem(key, stringValue);
    return true;
  } catch (error) {
    console.error(`Error storing data in localStorage for key ${key}:`, error);
    
    if (error instanceof DOMException && 
        (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      console.warn('localStorage quota exceeded, attempting cleanup...');
      
      // Try to clear some space by removing old items
      const keysToTry = [
        'cachedCertifiedLocations',
        'locations_certified_',
        'location_cache_'
      ];
      
      // Find keys matching patterns and delete oldest
      const keys = Object.keys(localStorage).filter(k => 
        keysToTry.some(prefix => k.startsWith(prefix))
      );
      
      // If we have too many keys, delete some
      if (keys.length > 5) {
        keys.slice(0, Math.floor(keys.length / 2)).forEach(k => {
          console.log(`Clearing localStorage key for space: ${k}`);
          localStorage.removeItem(k);
        });
        
        // Try again
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (e) {
          console.error('Still cannot store data after cleanup');
        }
      }
    }
    
    // Call fallback if provided
    if (fallbackAction) {
      fallbackAction();
    }
    
    return false;
  }
}

/**
 * Safely retrieve data from localStorage
 * @param key Storage key
 * @param defaultValue Default value if not found
 * @returns Retrieved value or default
 */
export function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving data from localStorage for key ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Clear localStorage items matching a pattern
 * @param keyPattern Pattern to match keys against
 * @returns Number of items removed
 */
export function clearStorageByPattern(keyPattern: string): number {
  let count = 0;
  
  try {
    const keys = Object.keys(localStorage).filter(k => k.includes(keyPattern));
    keys.forEach(k => {
      localStorage.removeItem(k);
      count++;
    });
  } catch (error) {
    console.error(`Error clearing localStorage items matching ${keyPattern}:`, error);
  }
  
  return count;
}

/**
 * Get localStorage usage statistics
 * @returns Object with usage stats
 */
export function getStorageStats(): {used: number, total: number, items: number} {
  try {
    let totalSize = 0;
    const items = Object.keys(localStorage).length;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        totalSize += key.length + value.length;
      }
    }
    
    // Convert to MB
    const usedMB = totalSize / 1024 / 1024;
    
    // Typical quota is 5-10MB depending on browser
    const estimatedQuotaMB = 5;
    
    return {
      used: usedMB,
      total: estimatedQuotaMB,
      items
    };
  } catch (error) {
    console.error('Error calculating storage stats:', error);
    return {
      used: 0,
      total: 5,
      items: 0
    };
  }
}
