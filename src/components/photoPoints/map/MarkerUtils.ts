
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';

/**
 * Get appropriate marker icon for a location
 */
export function getLocationMarker(
  location: SharedAstroSpot,
  isCertified: boolean,
  isHovered: boolean,
  isMobile: boolean
): L.DivIcon {
  // Base icon size and color
  const color = isCertified ? '#8b5cf6' : '#3b82f6';
  const hoverColor = '#f97316';
  const currentColor = isHovered ? hoverColor : color;
  
  // Get SIQS score if available
  const siqsScore = getSiqsScore(location.siqs);
  
  // Adjust size based on SIQS score and certification
  let size = 8;
  if (isCertified) {
    size = 10;
  } else if (siqsScore > 7) {
    size = 12;
  } else if (siqsScore > 5) {
    size = 10;
  }
  
  // Adjust for mobile
  if (isMobile) size = Math.max(size, 10);
  
  // Size increases when hovered
  const finalSize = isHovered ? size * 1.3 : size;
  
  return L.divIcon({
    html: `<div style="background-color: ${currentColor}; border: 2px solid white;"></div>`,
    className: `location-marker ${isHovered ? 'hovered' : ''}`,
    iconSize: [finalSize * 2, finalSize * 2],
    iconAnchor: [finalSize, finalSize],
    popupAnchor: [0, -finalSize]
  });
}

/**
 * Get a CSS class based on SIQS score
 */
export function getSiqsClass(siqsScore: number | null): string {
  if (siqsScore === null) return '';
  
  if (siqsScore >= 8) return 'siqs-excellent';
  if (siqsScore >= 6) return 'siqs-good';
  if (siqsScore >= 4) return 'siqs-average';
  if (siqsScore >= 2) return 'siqs-poor';
  return 'siqs-bad';
}

/**
 * Check if location is on water (placeholder implementation)
 */
export function isWaterSpot(location: SharedAstroSpot): boolean {
  if (!location.latitude || !location.longitude) return false;
  
  // Simplified check - could be replaced with a more sophisticated implementation
  if (location.isWater === true) return true;
  
  // If the location has a name that suggests it's water
  const waterKeywords = ['sea', 'ocean', 'lake', 'river', 'pond', 'bay', 'gulf', '海', '湖', '河'];
  const name = location.name || '';
  
  if (waterKeywords.some(keyword => name.toLowerCase().includes(keyword))) {
    return true;
  }
  
  return false;
}

/**
 * Check if location is valid for astronomy
 */
export function isValidAstronomyLocation(
  latitude: number | undefined,
  longitude: number | undefined,
  name?: string
): boolean {
  if (!latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) {
    return false;
  }
  
  // Filter out extreme latitudes (not good for star observation)
  if (Math.abs(latitude) > 80) {
    return false;
  }
  
  // Some basic validation - more rules could be added
  return true;
}
