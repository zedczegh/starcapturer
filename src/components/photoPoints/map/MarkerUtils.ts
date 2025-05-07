import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { isWaterLocation } from "@/utils/validation";
import { getProgressColor } from "@/components/siqs/utils/progressColor";
import { getSiqsScore } from "@/utils/siqsHelpers";
import L from 'leaflet'; // Add this import for the Leaflet library
import { formatSiqsScore, getSiqsColorClass } from "@/utils/mapSiqsDisplay";
import { hasCertification } from "../utils/certificationUtils";

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
    const defaultColor = '#4ADE80'; // Bright green fallback
    // Use our centralized getSiqsScore helper
    const siqsScore = getSiqsScore(location);
    return siqsScore > 0 ? getProgressColor(siqsScore) : defaultColor;
  }
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
  
  // Determine size based on device and hover state
  const size = isMobile ? 
    (isHovered ? 22 : 16) : // Mobile sizes
    (isHovered ? 28 : 24);  // Desktop sizes
  
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

/**
 * Generate marker icon HTML for a location with SIQS score
 */
export function generateMarkerHtml(
  location: SharedAstroSpot,
  isCertified: boolean,
  isHovered: boolean,
  isMobile: boolean = false,
  shouldPulse: boolean = false
): string {
  // Calculate base size based on hover state and mobile
  const baseSize = isHovered 
    ? (isMobile ? 28 : 38) 
    : (isMobile ? 20 : 28);
    
  // Calculate inner circle size
  const innerSize = baseSize * 0.75;
  
  // Determine certification status and styling
  const borderWidth = isCertified ? 2 : 1.5;
  const borderColor = isCertified ? "#FFD700" : "rgba(255,255,255,0.6)";
  let bgColor = "rgba(30,30,40,0.95)";
  
  // Handle different location types
  if (location.type === 'dark-site' || location.isDarkSkyReserve) {
    bgColor = "rgba(67, 56, 202, 0.95)";
  } else if (location.type === 'lodging') {
    bgColor = "rgba(14, 116, 144, 0.95)";
  }
  
  // Convert the SIQS score to a number value
  const siqsValue = getSiqsScore(location.siqs);
  
  // Get appropriate color class based on SIQS value
  const siqsClass = getSiqsColorClass(siqsValue);
  const siqsText = formatSiqsScore(siqsValue);

  const pulseAnimation = shouldPulse
    ? `animation: pulse 1.5s infinite; @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }`
    : '';

  // Build HTML for marker
  return `
    <div class="marker-container" style="
      width: ${baseSize}px;
      height: ${baseSize}px;
      position: relative;
      ${pulseAnimation}
    ">
      <div class="marker-outer" style="
        width: ${baseSize}px;
        height: ${baseSize}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: ${borderWidth}px solid ${borderColor};
        box-shadow: 0 0 8px rgba(0,0,0,0.3);
        transform-origin: center;
        transform: ${isHovered ? 'scale(1.1)' : 'scale(1)'};
        transition: transform 0.2s ease-out;
        background: ${bgColor};
      ">
        <div class="marker-inner" style="
          width: ${innerSize}px;
          height: ${innerSize}px;
          border-radius: 50%;
          background: ${bgColor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: system-ui, sans-serif;
          font-weight: 600;
          font-size: ${isMobile ? '9px' : '12px'};
          color: ${siqsClass};
        ">
          ${siqsText}
        </div>
      </div>
    </div>
  `;
}
