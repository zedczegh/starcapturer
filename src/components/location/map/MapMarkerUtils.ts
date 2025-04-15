
/**
 * Utility functions for creating map markers and icons
 * These functions help with marker creation and customization
 */
import L from 'leaflet';

/**
 * Configure Leaflet to fix common issues with icon paths
 */
export const configureLeaflet = () => {
  // Fix icon path issues in bundled environments
  delete L.Icon.Default.prototype._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
  
  // Configure performance optimizations when running on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    // Disable animations for better performance on mobile
    L.DomUtil.TRANSITION = L.DomUtil.TRANSITION ? L.DomUtil.TRANSITION : '';
    L.DomUtil.TRANSFORM = L.DomUtil.TRANSFORM ? L.DomUtil.TRANSFORM : '';
  }
};

/**
 * Create a custom marker icon for the map
 * @param color - Color of the marker
 * @returns L.DivIcon instance or null during SSR
 */
export function createCustomMarker(
  color: string = '#f43f5e', 
  shape: 'circle' | 'star' = 'circle',
  sizeMultiplier: number = 1.0
): L.DivIcon | null {
  // Return null during SSR to prevent errors
  if (typeof window === 'undefined') return null;
  
  try {
    const baseSize = 24 * sizeMultiplier;
    let html = '';
    
    if (shape === 'star') {
      // Star-shaped marker for certified locations
      html = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${baseSize}" height="${baseSize}" viewBox="0 0 24 24" fill="${color}" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      `;
    } else {
      // Circle-shaped marker for calculated locations
      html = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${baseSize}" height="${baseSize}" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="${color}" stroke="#FFFFFF" stroke-width="1.5" />
        </svg>
      `;
    }

    const icon = L.divIcon({
      className: "custom-marker-icon",
      iconAnchor: [baseSize/2, baseSize/2],
      popupAnchor: [0, -baseSize/2],
      html: html,
      iconSize: [baseSize, baseSize]
    });

    return icon;
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

/**
 * Format geo coordinates to a readable string
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Formatted coordinates string
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
};
