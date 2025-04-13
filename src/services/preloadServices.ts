import { preloadCertifiedLocations } from "./certifiedLocationsService";
import { initializeCodeProtection } from './codeProtectionService';

/**
 * Initialize services that should be loaded early
 * This runs before the app renders to ensure protections are in place
 */
export function initializePreloadServices(): void {
  // Initialize code protection first
  initializeCodeProtection();
  
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
  }, 1000);
}
