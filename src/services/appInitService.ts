
import { clearStorageByPattern, getStorageStats } from "@/utils/storageUtils";
import { clearLocationCache } from "./realTimeSiqsService";

/**
 * Initialize the app and perform maintenance tasks
 */
export function initializeApp(): void {
  // Check localStorage usage
  const stats = getStorageStats();
  console.log(`Storage usage: ${stats.used.toFixed(2)}MB / ~${stats.total}MB (${stats.items} items)`);
  
  // Clean up if storage usage is high
  if (stats.used > stats.total * 0.8) {
    console.warn(`Storage usage is high (${stats.used.toFixed(2)}MB), performing cleanup`);
    performStorageCleanup();
  }
  
  // Clean expired caches on startup
  clearLocationCache();
}

/**
 * Clean up localStorage to prevent quota issues
 */
function performStorageCleanup(): void {
  // Clear oldest cached locations
  const locationsClearedCount = clearStorageByPattern('location_');
  console.log(`Cleared ${locationsClearedCount} old location cache entries`);
  
  // Clear any old cached certified locations
  const certifiedClearedCount = clearStorageByPattern('locations_certified_');
  console.log(`Cleared ${certifiedClearedCount} old certified locations cache entries`);
}
