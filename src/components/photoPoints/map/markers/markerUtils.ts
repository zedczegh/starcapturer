
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import { getSiqsClass, getCertificationColor } from '@/utils/markerUtils';
import { isWaterLocation, isValidAstronomyLocation, isLikelyCoastalWater } from '@/utils/locationValidator';

// Enhanced filtering for water locations
export const isWaterSpot = (location: SharedAstroSpot): boolean => {
  // Never filter out certified locations
  if (location.isDarkSkyReserve || location.certification) {
    return false;
  }
  
  // Multi-layered water detection
  // 1. Main water detection
  if (isWaterLocation(location.latitude, location.longitude, false)) {
    return true;
  }
  
  // 2. Coastal water detection
  if (isLikelyCoastalWater(location.latitude, location.longitude)) {
    return true;
  }
  
  // 3. Name-based detection
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

// Create different marker styles for certified vs calculated locations
export const getLocationMarker = (location: SharedAstroSpot, isCertified: boolean, isHovered: boolean, isMobile: boolean) => {
  // Enhanced appearance for mobile
  const sizeMultiplier = isMobile ? 1.2 : 1.0; // 20% larger on mobile
  
  if (isCertified) {
    // For certified locations, use a color based on certification type
    const certColor = getCertificationColor(location);
    return createCustomMarker(certColor, 'star', sizeMultiplier);
  } else {
    // For calculated locations, use a brighter color based on SIQS with circle shape
    const defaultColor = '#4ADE80'; // Bright green fallback
    const color = location.siqs ? getProgressColor(location.siqs) : defaultColor;
    return createCustomMarker(color, 'circle', sizeMultiplier);
  }
};

// Get SIQS class for styling based on location score
export const getSiqsClassForLocation = (siqs: number | undefined) => {
  return getSiqsClass(siqs);
};
