
import { clearAllCache } from '../enhancedCache';
import { clearTableCache } from '../supabaseFetch';

/**
 * Utility to help clean cache when navigating between spots
 * This helps resolve the issue where old spot data is reused
 */

export function clearSpotCache(spotId?: string): void {
  console.log("Clearing spot cache for ID:", spotId || "all spots");
  
  // Flag to track if this is being called too frequently (potential cause of flashing)
  const now = Date.now();
  const lastClear = parseInt(sessionStorage.getItem('last-cache-clear-time') || '0');
  
  // If we're clearing cache too often, that might cause flashing
  if (now - lastClear < 500) { // Less than 500ms since last clear
    console.warn("Warning: Cache being cleared too frequently - this might cause UI flashing");
    // Don't skip the clear, but log so we can investigate
  }
  
  // Record this clear operation time
  try {
    sessionStorage.setItem('last-cache-clear-time', now.toString());
  } catch (e) {
    // Ignore storage errors
  }
  
  // Clear cache for this specific spot if provided
  if (spotId) {
    // Only clear if we haven't recently cleared this specific spot
    const spotClearKey = `spot-${spotId}-last-cleared`;
    const lastSpotClear = parseInt(sessionStorage.getItem(spotClearKey) || '0');
    
    if (now - lastSpotClear > 2000) { // Only clear if it's been more than 2 seconds
      // Clear specific cache entries related to this spot
      const keysToTryClear = [
        `spot-${spotId}`,
        `profile-${spotId}`,
        `comments-${spotId}`,
        `images-${spotId}`,
        `creator-${spotId}`,
        // Add query keys that match React Query patterns
        `["astroSpot","${spotId}"]`,
        `["spotImages","${spotId}"]`,
        `["comments","${spotId}"]`,
        `["creatorProfile"]`,
        // Add additional keys that might be causing stale data
        'community-spots-data',
        'recent-spots',
        'spot-list'
      ];
      
      keysToTryClear.forEach(key => {
        try {
          sessionStorage.removeItem(key);
          localStorage.removeItem(`cache:${key}`);
        } catch (e) {
          // Ignore errors
        }
      });
      
      // Clear Supabase table cache for this spot
      clearTableCache('user_astro_spots');
      
      // Track when we last cleared this spot's cache
      try {
        sessionStorage.setItem(spotClearKey, now.toString());
      } catch (e) {
        // Ignore storage errors
      }
    } else {
      console.log("Skipping cache clear for spot as it was recently cleared:", spotId);
    }
  } else {
    // Only do full clears rarely to prevent flashing
    const lastFullClear = parseInt(sessionStorage.getItem('last-full-cache-clear') || '0');
    if (now - lastFullClear > 10000) { // Only do full clears every 10 seconds max
      // Clear all spot-related caches
      clearAllCache();
      clearTableCache('user_astro_spots');
      sessionStorage.setItem('last-full-cache-clear', now.toString());
    } else {
      console.log("Skipping full cache clear to prevent UI flashing");
    }
  }
}

export function makeSureProfileLoadsCorrectly(spotId: string): void {
  // This function can be called before loading a profile
  // to ensure the cache is cleared properly
  clearSpotCache(spotId);
  
  // Add a timestamp to sessionStorage to mark when this spot was last accessed
  try {
    sessionStorage.setItem(`last-access-${spotId}`, Date.now().toString());
    
    // Also store this as the most recently viewed spot ID
    sessionStorage.setItem('most-recent-spot-id', spotId);
    sessionStorage.setItem('most-recent-access-time', Date.now().toString());
  } catch (e) {
    // Ignore errors
  }
}

/**
 * Helper function to check if we're seeing the same profile repeatedly
 */
export function detectProfileCacheLoop(spotId: string): boolean {
  try {
    const lastViewed = sessionStorage.getItem('last-viewed-spot');
    const currentTime = Date.now();
    const lastViewTime = parseInt(sessionStorage.getItem('last-view-time') || '0');
    
    // If we're viewing the same spot very frequently, it might be a cache loop
    if (lastViewed && lastViewed !== spotId && currentTime - lastViewTime < 2000) {
      console.warn("Potential cache loop detected - different spots viewed in rapid succession");
      clearSpotCache(); // Clear everything to break the cycle
      return true;
    }
    
    // Update tracking info
    sessionStorage.setItem('last-viewed-spot', spotId);
    sessionStorage.setItem('last-view-time', currentTime.toString());
    return false;
  } catch (e) {
    return false;
  }
}

// New helper to support smoother transitions
export function prepareForProfileTransition(): void {
  // Called when navigating between profiles to ensure smooth transitions
  try {
    // Set a flag indicating we're in a transition
    sessionStorage.setItem('profile-transition-active', 'true');
    sessionStorage.setItem('profile-transition-timestamp', Date.now().toString());
    
    // This flag will be checked by components to handle special transition cases
    // that help prevent flashing during navigation
  } catch (e) {
    // Ignore storage errors
  }
}
