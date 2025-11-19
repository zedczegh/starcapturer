
import { preloadCertifiedLocations } from "./certifiedLocationsService";

/**
 * Initialize all preloading services
 * This should be called early in the application lifecycle
 */
export function initializePreloadServices() {
  // Use requestIdleCallback for non-blocking preload
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadCertifiedLocations()
        .then(locations => {
          console.log(`Preloaded ${locations.length} certified locations`);
        })
        .catch(error => {
          console.error("Error preloading certified locations:", error);
        });
    }, { timeout: 2000 });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadCertifiedLocations().catch(console.error);
    }, 100);
  }
}
