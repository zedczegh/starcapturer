
import { preloadCertifiedLocations } from "./certifiedLocationsService";

/**
 * Initialize all preloading services
 * This should be called early in the application lifecycle
 */
export function initializePreloadServices() {
  // Start preloading certified locations immediately
  // This will make them available globally as soon as possible
  console.log("Starting preload of certified locations");
  preloadCertifiedLocations()
    .then(locations => {
      console.log(`Successfully preloaded ${locations.length} certified locations`);
    })
    .catch(error => {
      console.error("Error preloading certified locations:", error);
    });
}
