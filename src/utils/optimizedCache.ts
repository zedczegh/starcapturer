
/**
 * Optimized cache utility to prevent storage quota issues
 */

// Maximum number of items to store in localStorage
const MAX_CACHE_ITEMS = 50;

// Cache item with timestamp for expiration management
interface CacheItem<T> {
  value: T;
  timestamp: number;
  priority: number; // Higher number = higher priority
}

/**
 * Store a value in localStorage with optimized management to prevent quota errors
 */
export function setOptimizedStorageItem<T>(key: string, value: T, priority: number = 1, ttl: number = 3600000): boolean {
  try {
    // First try to store the item directly
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      priority
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      // If storage is full, clean up
      if (error instanceof DOMException && (
        error.name === 'QuotaExceededError' || 
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        // Clean up strategy: remove oldest and lowest priority items
        cleanupStorage();
        
        // Try again after cleanup
        try {
          localStorage.setItem(key, JSON.stringify(item));
          return true;
        } catch (secondError) {
          console.error('Still could not save to localStorage after cleanup:', secondError);
          return false;
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error saving to optimized storage:', error);
    return false;
  }
}

/**
 * Get a value from localStorage with type safety
 */
export function getOptimizedStorageItem<T>(key: string): T | null {
  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    
    const item: CacheItem<T> = JSON.parse(itemStr);
    return item.value;
  } catch (error) {
    console.error('Error retrieving from optimized storage:', error);
    return null;
  }
}

/**
 * Clean up localStorage by removing expired and low priority items
 */
function cleanupStorage(): void {
  try {
    // Get all keys
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    
    // Skip cleaning if we have few items
    if (keys.length < MAX_CACHE_ITEMS) return;
    
    // Build array of items with their metadata
    const items: Array<{key: string; item: CacheItem<any>}> = [];
    for (const key of keys) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          if (parsed && parsed.timestamp && parsed.priority !== undefined) {
            items.push({ key, item: parsed });
          }
        }
      } catch (e) {
        // Skip non-parseable items
      }
    }
    
    // Sort by priority (ascending) and then by age (oldest first)
    items.sort((a, b) => {
      if (a.item.priority !== b.item.priority) {
        return a.item.priority - b.item.priority;
      }
      return a.item.timestamp - b.item.timestamp;
    });
    
    // Remove 30% of items, starting with lowest priority and oldest
    const removeCount = Math.ceil(items.length * 0.3);
    for (let i = 0; i < removeCount && i < items.length; i++) {
      localStorage.removeItem(items[i].key);
    }
    
  } catch (error) {
    console.error('Error cleaning storage:', error);
  }
}

/**
 * Clear all items managed by the optimized cache
 */
export function clearOptimizedStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing optimized storage:', error);
  }
}
