
import L from 'leaflet';
import { SharedAstroSpot } from '@/types/weather';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import { isWaterLocation } from '@/utils/locationWaterCheck';
import { getSafeScore as getScoreSafe } from '@/utils/geoUtils';

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
  try {
    const { isLikelyCoastalWater: checkCoastal } = require('@/utils/locationValidator');
    return checkCoastal(latitude, longitude);
  } catch (error) {
    return false;
  }
};

/**
 * Check if a location is valid for astronomy
 */
export const isValidAstronomyLocation = (latitude: number, longitude: number, name?: string): boolean => {
  try {
    const { isValidAstronomyLocation: checkValid } = require('@/utils/locationValidator');
    return checkValid(latitude, longitude, name);
  } catch (error) {
    return true;
  }
};

/**
 * Get appropriate marker for location
 */
export const getLocationMarker = (
  location: SharedAstroSpot, 
  isCertified: boolean, 
  isHovered: boolean, 
  isMobile: boolean
): L.DivIcon => {
  const sizeMultiplier = isMobile ? 1.2 : 1.0;
  
  if (isCertified) {
    const certColor = getCertificationColor(location);
    return createCustomMarker(certColor, 'star', sizeMultiplier);
  } else {
    const defaultColor = '#4ADE80';
    const score = getSafeScore(location.siqs);
    const color = score ? getProgressColor(score) : defaultColor;
    return createCustomMarker(color, 'circle', sizeMultiplier);
  }
};

/**
 * Get certification color for marker
 */
export const getCertificationColor = (location: SharedAstroSpot): string => {
  if (location.isDarkSkyReserve) {
    return '#60a5fa'; // blue-400
  } else {
    return '#34d399'; // emerald-400
  }
};

/**
 * Get CSS class based on SIQS score
 */
export const getSiqsClass = (siqs?: number | { score: number; isViable: boolean }): string => {
  const score = getSafeScore(siqs);
  
  if (!score) return '';
  if (score > 8) return 'siqs-excellent';
  if (score > 6) return 'siqs-good';
  if (score > 4) return 'siqs-fair';
  if (score > 2) return 'siqs-poor';
  return 'siqs-very-poor';
};

/**
 * Get safe SIQS score regardless of format
 */
export const getSafeScore = (siqs?: number | { score: number; isViable: boolean }): number => {
  return getScoreSafe(siqs);
};
