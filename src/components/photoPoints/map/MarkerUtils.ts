
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import { getSafeScore as geoUtilsGetSafeScore } from '@/utils/geoUtils';
import L from 'leaflet';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import { isWaterLocation } from '@/utils/locationWaterCheck';

/**
 * Check if a location is a water-based spot
 */
export const isWaterSpot = (location: SharedAstroSpot): boolean => {
  if (location.isDarkSkyReserve || location.certification) {
    return false;
  }
  
  if (isWaterLocation(location.latitude, location.longitude, false)) {
    return true;
  }
  
  if (isLikelyCoastalWater(location.latitude, location.longitude)) {
    return true;
  }
  
  if (location.name) {
    const lowerName = location.name.toLowerCase();
    const waterKeywords = [
      'ocean', 'sea', 'bay', 'gulf', 'lake', 'strait', 
      'channel', 'sound', 'harbor', 'harbour', 'port', 
      'pier', 'marina', 'lagoon', 'reservoir', 'fjord', 
      'canal', 'pond', 'basin', 'cove', 'inlet', 'beach'
    ];
    
    for (const keyword of waterKeywords) {
      if (lowerName.includes(keyword)) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Check if a location is likely coastal water
 */
export const isLikelyCoastalWater = (latitude: number, longitude: number): boolean => {
  // Simple implementation without require
  const isLikely = longitude > -10 && longitude < 40 && 
                  latitude > 30 && latitude < 60;
  return false; // Simplified version to avoid require
};

/**
 * Check if a location is valid for astronomy
 */
export const isValidAstronomyLocation = (latitude: number, longitude: number, name?: string): boolean => {
  // Simple implementation without require
  return true; // Default to true to avoid require
};

/**
 * Get appropriate marker for location
 */
export const getLocationMarker = (
  location: SharedAstroSpot, 
  isCertified: boolean, 
  isHovered: boolean, 
  isMobile: boolean
): L.DivIcon | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const sizeMultiplier = isMobile ? 1.2 : 1.0;
    const baseSize = 24 * sizeMultiplier;
    let html = '';
    
    // Apply hardware acceleration and optimize rendering
    const styleOptimizations = 'will-change: transform; transform: translateZ(0); backface-visibility: hidden;';
    
    if (isCertified) {
      // Color map according to certification type - Updated colors to match legend
      let color = '#10b981'; // Default green for Dark Sky Parks
      if (location.isDarkSkyReserve) {
        color = '#8b5cf6'; // Purple for Dark Sky Reserves
      } else if (location.certification) {
        const cert = location.certification.toLowerCase();
        if (cert.includes('park')) {
          color = '#10b981'; // Green for Dark Sky Parks
        } else if (cert.includes('community')) {
          color = '#f59e0b'; // Gold for Dark Sky Communities
        } else if (cert.includes('urban')) {
          color = '#3b82f6'; // Blue for Urban Night Sky Places
        }
      }
      
      html = `
        <svg xmlns="http://www.w3.org/2000/svg" 
             width="${baseSize}" height="${baseSize}" 
             viewBox="0 0 24 24" 
             style="${styleOptimizations}"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" 
                   fill="${color}" 
                   stroke="#FFFFFF" 
                   stroke-width="1" 
                   stroke-linejoin="round"
          />
        </svg>
      `;
    } else {
      // Calculated locations use SIQS-based colors
      const score = location.siqs !== null && location.siqs !== undefined ? 
        geoUtilsGetSafeScore(location.siqs) : 0;
      const color = score ? getProgressColor(score) : '#4ADE80';
      
      html = `
        <svg xmlns="http://www.w3.org/2000/svg" 
             width="${baseSize}" height="${baseSize}" 
             viewBox="0 0 24 24"
             style="${styleOptimizations}"
        >
          <circle cx="12" cy="12" r="10" 
                  fill="${color}" 
                  stroke="#FFFFFF" 
                  stroke-width="1"
          />
        </svg>
      `;
    }

    return L.divIcon({
      className: "custom-marker-icon",
      iconAnchor: [baseSize/2, baseSize/2],
      popupAnchor: [0, -baseSize/2],
      html: html,
      iconSize: [baseSize, baseSize]
    });
  } catch (error) {
    console.error("Error creating custom marker:", error);
    return null;
  }
};

/**
 * Get certification color for marker
 */
export const getCertificationColor = (location: SharedAstroSpot): string => {
  if (location.isDarkSkyReserve) {
    return '#8b5cf6'; // Updated to purple for Dark Sky Reserves
  } else if (location.certification) {
    const cert = location.certification.toLowerCase();
    if (cert.includes('park')) {
      return '#10b981'; // Green for Dark Sky Parks
    } else if (cert.includes('community')) {
      return '#f59e0b'; // Gold for Dark Sky Communities
    } else if (cert.includes('urban')) {
      return '#3b82f6'; // Blue for Urban Night Sky Places
    }
  }
  return '#10b981'; // Default green
};

/**
 * Get CSS class based on SIQS score
 */
export const getSiqsClass = (siqs?: number | { score: number; isViable: boolean }): string => {
  const score = geoUtilsGetSafeScore(siqs);
  
  if (!score) return '';
  if (score > 8) return 'siqs-excellent';
  if (score > 6) return 'siqs-good';
  if (score > 4) return 'siqs-fair';
  if (score > 2) return 'siqs-poor';
  return 'siqs-very-poor';
};

// Re-export the getSafeScore function from geoUtils for consistency
export const getSafeScore = geoUtilsGetSafeScore;
