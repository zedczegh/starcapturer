
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
 * Create an SVG marker icon for the map
 * @param color - Color of the marker
 * @param shape - Shape of the marker (circle or star)
 * @param sizeMultiplier - Multiplier for marker size (useful for mobile)
 * @returns Leaflet DivIcon with the SVG marker
 */
export const createCustomMarker = (
  color: string = '#3b82f6', 
  shape: 'circle' | 'star' | undefined = undefined,
  sizeMultiplier: number = 1.0
): L.DivIcon => {
  // Base size for markers, can be scaled for mobile devices
  const baseSize = sizeMultiplier * 24;
  const baseStrokeWidth = sizeMultiplier * 1.5;
  
  // Generate SVG based on shape
  let svgContent = '';
  
  if (shape === 'star') {
    // Star shape for certified locations
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" 
        width="${baseSize}" height="${baseSize}" 
        viewBox="0 0 24 24" 
        fill="${color}" stroke="#FFFFFF" 
        stroke-width="${baseStrokeWidth}" 
        stroke-linecap="round" 
        stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    `;
  } else {
    // Circle shape for calculated locations
    svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" 
        width="${baseSize}" height="${baseSize}" 
        viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" 
            fill="${color}" 
            stroke="#FFFFFF" 
            stroke-width="${baseStrokeWidth}" />
      </svg>
    `;
  }
  
  // Calculate icon size with shadow/margin consideration
  const iconSize = baseSize + (sizeMultiplier * 8);
  
  return L.divIcon({
    html: svgContent,
    className: 'custom-map-marker',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize/2, iconSize/2],
    popupAnchor: [0, -(iconSize/2)]
  });
};

/**
 * Format geo coordinates to a readable string
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Formatted coordinates string
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
};
