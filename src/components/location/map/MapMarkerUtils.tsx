
import L from "leaflet";
import { createCustomCircleMarker } from "./markers/CircleMarker";
import { createCustomStarMarker } from "./markers/StarMarker";
import { createCustomUserMarker } from "./markers/UserMarker";

/**
 * Create a custom marker icon with pulse animation effect
 * @param color - The color of the marker
 * @param type - The type of marker to create (circle, star, user)
 * @returns L.DivIcon instance or null during SSR
 */
export function createCustomMarker(color = '#f43f5e', type = 'circle'): L.DivIcon | null {
  // Return null during SSR to prevent errors
  if (typeof window === 'undefined') return null;
  
  try {
    switch (type) {
      case 'star':
        return createCustomStarMarker(color);
      case 'user':
        return createCustomUserMarker(color);
      case 'circle':
      default:
        return createCustomCircleMarker(color);
    }
  } catch (error) {
    console.error("Error creating custom marker:", error);
    // Return default icon as fallback
    return new L.Icon.Default();
  }
}

/**
 * Configure Leaflet default settings
 * Avoids SSR issues by running only on client side
 */
export function configureLeaflet(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Only run this on the client side
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  } catch (error) {
    console.error("Error configuring Leaflet:", error);
  }
}

// Call configure function immediately but only on client
if (typeof window !== 'undefined') {
  configureLeaflet();
}
