
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

// Icon configurations
const markerSizePx = 26;
const hoverSizePx = 32;

// Certified location marker (blue star)
export function getCertifiedLocationIcon(isHovered = false) {
  const size = isHovered ? hoverSizePx : markerSizePx;
  const strokeWidth = isHovered ? 2 : 1.5;
  
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div class="icon-container certified ${isHovered ? 'hovered' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#3B82F6" stroke="#0D499E" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
}

// Dark Sky Reserve marker (purple star)
export function getDarkSkyLocationIcon(isHovered = false) {
  const size = isHovered ? hoverSizePx : markerSizePx;
  const strokeWidth = isHovered ? 2 : 1.5;
  
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div class="icon-container dark-sky ${isHovered ? 'hovered' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#8B5CF6" stroke="#5B21B6" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
}

// Calculated location marker (blue circle)
export function getCalculatedLocationIcon(isHovered = false) {
  const size = isHovered ? hoverSizePx : markerSizePx;
  const strokeWidth = isHovered ? 2 : 1.5;
  
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div class="icon-container calculated ${isHovered ? 'hovered' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#93C5FD" stroke="#1D4ED8" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
}

// Forecast location marker (calendar icon inside circle)
export function getForecastLocationIcon(isHovered = false) {
  const size = isHovered ? hoverSizePx : markerSizePx;
  const strokeWidth = isHovered ? 2 : 1.5;
  
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div class="icon-container forecast ${isHovered ? 'hovered' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#C4B5FD" stroke="#7C3AED" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
}

// Helper function to get the appropriate marker icon based on location type
export function getLocationMarker(location: SharedAstroSpot, isCertified: boolean, isHovered: boolean, isMobile: boolean = false) {
  if (location.isForecast) {
    return getForecastLocationIcon(isHovered);
  }
  
  if (location.isDarkSkyReserve) {
    return getDarkSkyLocationIcon(isHovered);
  }
  
  if (isCertified || location.certification) {
    return getCertifiedLocationIcon(isHovered);
  }
  
  return getCalculatedLocationIcon(isHovered);
}

// Get SIQS class based on score value
export function getSiqsClass(score: number | null): string {
  if (score === null || score <= 0) return 'poor';
  if (score >= 8) return 'excellent';
  if (score >= 6) return 'good';
  if (score >= 4) return 'fair';
  return 'poor';
}

// Add the missing createCustomIcon function
export function createCustomIcon(location: SharedAstroSpot, isHovered: boolean) {
  return getLocationMarker(location, location.certification != null, isHovered);
}
