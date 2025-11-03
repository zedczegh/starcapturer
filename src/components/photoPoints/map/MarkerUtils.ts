
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
    return 'rgba(74, 222, 128, 0.85)'; // Default green with transparency
  }
  
  const certification = (location.certification || '').toLowerCase();
  
  // Atlas Obscura locations get a distinctive cyan color
  if (certification.includes('atlas obscura')) {
    return 'rgba(6, 182, 212, 0.85)'; // Cyan for Atlas Obscura #06b6d4
  }
  
  // IMPORTANT: Ensure communities use gold/yellow color
  if (certification.includes('community')) {
    return 'rgba(255, 215, 0, 0.85)'; // Gold for Dark Sky Community #FFD700
  } else if (certification.includes('reserve') || certification.includes('sanctuary') || location.isDarkSkyReserve) {
    return 'rgba(155, 135, 245, 0.85)'; // Purple for reserves #9b87f5
  } else if (certification.includes('park')) {
    return 'rgba(74, 222, 128, 0.85)'; // Green for Dark Sky Park #4ADE80
  } else if (certification.includes('urban') || certification.includes('night sky place')) {
    return 'rgba(30, 174, 219, 0.85)'; // Blue for Urban Night Sky #1EAEDB
  } else if (certification.includes('lodging')) {
    return 'rgba(0, 0, 128, 0.85)'; // Navy blue for Dark Sky Lodging
  } else {
    return 'rgba(155, 135, 245, 0.85)'; // Default to reserve color
  }
};

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
  activeView: 'certified' | 'calculated' | 'obscura' | 'mountains'
): boolean => {
  const isObscura = location.certification?.toLowerCase().includes('atlas obscura');
  const isMountain = location.certification?.toLowerCase().includes('natural mountain');
  
  // Filter based on active view
  if (activeView === 'certified') {
    // Only show certified dark sky locations (not obscura, mountains, or calculated)
    return isCertified && !isObscura && !isMountain;
  } else if (activeView === 'obscura') {
    // Only show Atlas Obscura locations
    return isObscura;
  } else if (activeView === 'mountains') {
    // Only show mountain locations
    return isMountain;
  } else if (activeView === 'calculated') {
    // Only show calculated locations (not certified, obscura, or mountains)
    return !isCertified && !isObscura && !isMountain;
  }
  
  // Skip water locations for calculated spots (never skip certified)
  if (!isCertified && isWaterSpot(location)) {
    return false;
  }
  
  return true;
};

/**
 * Get marker color based on SIQS score with fallback to certification color
 * Mountains always use real-time SIQS coloring
 * @param location Location to get color for
 * @returns Hex color string
 */
export const getLocationColor = (location: SharedAstroSpot): string => {
  // Always prioritize SIQS-based color if we have a valid SIQS score
  const siqsScore = getSiqsScore(location);
  
  // Check if this is a mountain location - mountains ALWAYS use SIQS coloring
  const isMountain = location.certification?.toLowerCase().includes('natural mountain');
  
  if (siqsScore > 0 || isMountain) {
    // Use SIQS-based color for all locations with valid scores
    // Mountains always use SIQS color, even if score is 0 (will show as low SIQS)
    return getProgressColor(siqsScore || 0);
  }
  
  // Fall back to certification color if no SIQS score available (for non-mountain certified locations)
  if (location.isDarkSkyReserve || location.certification) {
    return getCertificationColor(location);
  }
  
  // Final fallback for locations without SIQS or certification
  return '#4ADE80'; // Bright green fallback
};

/**
 * Creates a custom marker for the map based on location properties
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
  
  // Check if this is an Atlas Obscura location
  const isObscura = location.certification?.toLowerCase().includes('atlas obscura');
  
  // Check if this is a mountain location
  const isMountain = location.certification?.toLowerCase().includes('natural mountain');
  
  // Determine size based on device and hover state
  const size = isMobile ? 
    (isHovered ? 22 : 16) : // Mobile sizes
    (isHovered ? 28 : 24);  // Desktop sizes
  
  // Choose the appropriate icon
  let iconSvg = '';
  if (isMountain) {
    // Mountain icon for natural mountain locations
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
      <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
    </svg>`;
  } else if (isObscura) {
    // Eye icon for Atlas Obscura locations
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`;
  } else if (isCertified) {
    // Star icon for certified dark sky locations
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`;
  }
  
  // Create a marker with a custom HTML representation
  return L.divIcon({
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
        ${iconSvg}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
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
