
/**
 * Map marker utilities
 * IMPORTANT: This file contains critical marker creation and styling logic.
 */
import L from 'leaflet';
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { isWaterLocation } from "@/utils/validation";
import { getProgressColor } from "@/components/siqs/utils/progressColor";
import { getSiqsScore } from "@/utils/siqsHelpers";
import { createCustomMarker } from "@/components/location/map/MapMarkerUtils";
import TakahashiMarkerSVG from "@/components/community/TakahashiMarkerSVG";

/**
 * Get SIQS quality class for styling
 * @param siqs SIQS score
 * @returns CSS class name based on SIQS quality
 */
export const getSiqsClass = (siqs?: number | null | { score: number; isViable: boolean }): string => {
  if (siqs === undefined || siqs === null) return '';
  
  // Use our enhanced getSiqsScore utility if the input is not already a number
  const score = typeof siqs === 'number' ? siqs : getSiqsScore(siqs);
  
  if (score === 0) return '';
  if (score >= 7.5) return 'siqs-excellent';
  if (score >= 5.5) return 'siqs-good';
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
    return location.siqs ? getProgressColor(getSiqsScore(location.siqs)) : defaultColor;
  }
};

/**
 * Creates marker content with telescope icon for astro spots
 * @param isAstroSpot Is this an astro spot location
 * @param color Base color for the marker
 * @param size Size of the marker 
 * @returns HTML string for marker content
 */
export const createMarkerContent = (isAstroSpot: boolean, color: string, size: number): string => {
  if (isAstroSpot) {
    return `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1.5px solid #FFFFFF;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
      ">
        <div style="color: white; font-size: ${size * 0.6}px;">🔭</div>
      </div>
    `;
  }
  
  // Regular location marker
  return `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 1.5px solid #FFFFFF;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
    "></div>
  `;
};

/**
 * Check if a location is valid for astronomy viewing
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns boolean indicating if location is valid for astronomy
 */
export const isValidAstronomyLocation = (
  latitude: number, 
  longitude: number
): boolean => {
  // Must have valid coordinates
  if (!isFinite(latitude) || !isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return false;
  }
  
  // Additional validation can be added here
  return true;
};

/**
 * Create a custom marker icon for the map
 * @param location Location data
 * @param isCertified If this is a certified location
 * @param isHovered If marker is currently hovered
 * @param isMobile If we're on mobile
 * @returns Leaflet DivIcon instance
 */
export const getLocationMarker = (
  location: SharedAstroSpot,
  isCertified: boolean,
  isHovered: boolean,
  isMobile: boolean
): L.DivIcon => {
  const baseSize = isMobile ? 24 : 26;
  const size = isHovered ? baseSize * 1.15 : baseSize;
  
  // Use telescope icon for certified locations (more visible)
  const useTelescopeIcon = isCertified || 
    (location.certification && location.certification.length > 0) || 
    location.isDarkSkyReserve;
    
  const color = getLocationColor(location);
  
  // Create the marker HTML content with telescope icon for astro locations
  const markerHtml = createMarkerContent(useTelescopeIcon, color, size);
  
  // Create and return divIcon
  return L.divIcon({
    className: `custom-marker ${isHovered ? "hovered" : ""} ${isCertified ? "certified" : ""}`,
    html: markerHtml,
    iconSize: [size, size],
    iconAnchor: useTelescopeIcon ? [size/2, size/2] : [size/2, size],
    popupAnchor: useTelescopeIcon ? [0, -size/2] : [0, -size]
  });
};
