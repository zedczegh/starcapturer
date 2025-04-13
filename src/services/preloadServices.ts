
import { preloadCertifiedLocations } from "./certifiedLocationsService";
import { clearSiqsCache } from "./realTimeSiqsService";

/**
 * Initialize all preloading services
 * This should be called early in the application lifecycle
 */
export function initializePreloadServices() {
  // Start preloading certified locations immediately
  // This will make them available globally as soon as possible
  setTimeout(() => {
    console.log("Starting preload of certified locations");
    preloadCertifiedLocations()
      .then(locations => {
        console.log(`Successfully preloaded ${locations.length} certified locations`);
      })
      .catch(error => {
        console.error("Error preloading certified locations:", error);
      });
      
    // Clear outdated SIQS cache on startup
    clearSiqsCache(24 * 60 * 60 * 1000); // Clear entries older than 24 hours
  }, 1000);
  
  // Register cache cleanup routine
  const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
  setInterval(() => {
    clearSiqsCache(12 * 60 * 60 * 1000); // Clear entries older than 12 hours during runtime
  }, CLEANUP_INTERVAL);
}
