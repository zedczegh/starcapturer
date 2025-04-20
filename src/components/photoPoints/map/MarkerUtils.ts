
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { isWaterLocation } from "@/utils/validation";
import { getProgressColor } from "@/components/siqs/utils/progressColor";
import { getSiqsScore } from "@/utils/siqsHelpers";
import L from 'leaflet'; // Add this import for the Leaflet library

/**
 * Get SIQS quality class for styling
 * @param siqs SIQS score
 * @returns CSS class name based on SIQS quality
 */
export const getSiqsClass = (siqs?: number | null): string => {
  if (siqs === undefined || siqs === null || siqs <= 0) return '';
  if (siqs >= 7.5) return 'siqs-excellent';
  if (siqs >= 5.5) return 'siqs-good';
  return 'siqs-poor';
};

/**
 * Determines if a location is a water spot (for filtering)
 * @param location Location to check
 * @returns boolean indicating if location is a water spot
 */
export const isWaterSpot = (location: SharedAstroSpot): boolean => {
  // Never filter out certified locations
  if (location.isDarkSkyReserve || location.certification) {
    return false;
  }
  
  // Use enhanced water detection
  return isWaterLocation(
    location.latitude, 
    location.longitude, 
    Boolean(location.isDarkSkyReserve || location.certification)
  );
};

/**
 * Get certification type based color for markers
 * @param location Location to get color for
 * @returns RGBA color string with transparency
 */
export const getCertificationColor = (location: SharedAstroSpot): string => {
  if (!location.isDarkSkyReserve && !location.certification) {
    return '#4ADE80'; // Default green for non-certified
  }
  
  const certification = (location.certification || '').toLowerCase();
  
  // IMPORTANT: Match colors with the legend - these must match exactly
  if (certification.includes('community')) {
    return '#FFA500'; // Gold/Orange for Dark Sky Community
  } else if (certification.includes('reserve') || certification.includes('sanctuary') || location.isDarkSkyReserve) {
    return '#9b87f5'; // Purple for reserves #9b87f5
  } else if (certification.includes('park')) {
    return '#4ADE80'; // Green for Dark Sky Park #4ADE80
  } else if (certification.includes('urban') || certification.includes('night sky place')) {
    return '#0EA5E9'; // Blue for Urban Night Sky #0EA5E9
  } else if (certification.includes('lodging')) {
    return '#1e3a8a'; // Dark blue for Dark Sky Lodging
  } else {
    return '#9b87f5'; // Default to reserve color
  }
};

// Cache for markers to improve performance
const markerCache = new Map<string, L.DivIcon>();

/**
 * Determine if a location should be shown based on the active view
 * @param location Location to check
 * @param isCertified Whether location is certified
 * @param activeView Current active view
 * @returns boolean indicating if location should be shown
 */
export const shouldShowLocationMarker = (
  location: SharedAstroSpot, 
  isCertified: boolean,
  activeView: 'certified' | 'calculated'
): boolean => {
  // IMPORTANT: Skip rendering calculated locations in certified view
  if (activeView === 'certified' && !isCertified) {
    return false;
  }
  
  // Skip water locations for calculated spots (never skip certified)
  if (!isCertified && isWaterSpot(location)) {
    return false;
  }
  
  return true;
};

/**
 * Get marker color based on location type and SIQS score
 * @param location Location to get color for
 * @returns Hex color string
 */
export const getLocationColor = (location: SharedAstroSpot): string => {
  if (location.isDarkSkyReserve || location.certification) {
    return getCertificationColor(location);
  } else {
    // Match SIQS score colors with the legend - these must match exactly
    const siqsScore = getSiqsScore(location);
    if (siqsScore >= 7.5) return '#22c55e'; // Excellent - match legend exactly
    if (siqsScore >= 5.5) return '#eab308'; // Good - match legend exactly
    if (siqsScore >= 4.0) return '#f97316'; // Average - match legend exactly
    return '#ef4444'; // Below Average - match legend exactly
  }
};

/**
 * Creates a custom marker for the map based on location properties
 * with improved performance through caching
 * @param location The location data
 * @param isCertified Whether the location is certified
 * @param isHovered Whether the marker is currently hovered
 * @param isMobile Whether we're on a mobile device
 * @returns Leaflet icon for the marker
 */
export const getLocationMarker = (
  location: SharedAstroSpot,
  isCertified: boolean,
  isHovered: boolean,
  isMobile: boolean
): L.DivIcon => {
  // Get the marker color based on location properties
  const color = getLocationColor(location);
  
  // Determine size based on device and hover state
  const size = isMobile ? 
    (isHovered ? 22 : 16) : // Mobile sizes
    (isHovered ? 28 : 24);  // Desktop sizes
  
  // Create a cache key based on the parameters
  const cacheKey = `${color}-${isCertified ? 1 : 0}-${isHovered ? 1 : 0}-${size}`;
  
  // Check if we have this marker in the cache
  if (markerCache.has(cacheKey)) {
    return markerCache.get(cacheKey)!;
  }
  
  // Create a marker with a custom HTML representation
  const marker = L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div 
        style="
          background-color: ${color}; 
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >
        ${isCertified ? 
          `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
           </svg>` : 
          ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
  
  // Store in the cache for future use (limit cache size)
  if (markerCache.size > 1000) {
    // Clear part of the cache if it gets too large
    const keysToDelete = Array.from(markerCache.keys()).slice(0, 200);
    keysToDelete.forEach(key => markerCache.delete(key));
  }
  markerCache.set(cacheKey, marker);
  
  return marker;
};

/**
 * Check if a location is valid for astronomy viewing
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param name Optional location name for additional validation
 * @returns Boolean indicating if location is valid
 */
export const isValidAstronomyLocation = (
  latitude: number,
  longitude: number,
  name?: string
): boolean => {
  // Skip validation for locations without coordinates
  if (!latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) {
    return false;
  }
  
  // Filter out obvious water names
  if (name) {
    const lowerName = name.toLowerCase();
    if (
      lowerName.includes('sea') || 
      lowerName.includes('ocean') || 
      lowerName.includes('bay') ||
      lowerName.includes('lake') ||
      lowerName.includes('lagoon') ||
      lowerName.includes('gulf') ||
      lowerName.includes('strait')
    ) {
      return false;
    }
  }
  
  return true;
};
