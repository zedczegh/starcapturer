
/**
 * Map utility functions to help with map operations and coordinate conversions
 * This file re-exports functionality from more focused modules
 */

// Export everything from the geoCalculations module
export {
  EARTH_RADIUS,
  degToRad,
  calculateDistance,
  normalizeCoordinates,
  validateCoordinates
} from './map/geoCalculations';

// Export coordinate conversion utilities
export { wgs84ToGcj02 } from './map/coordinateConversion';

// Export URL generator functions
export {
  generateGaodeMapUrl,
  generateGoogleMapUrl,
  generateBaiduMapUrl,
  generateAppleMapUrl
} from './map/urlGenerators';

// Export location analysis functions
export {
  findNearestCity,
  estimateBortleScale
} from './map/locationAnalysis';

// Add a helper function for formatting distance
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

// Add helper functions for SIQS score handling
export const getSafeScore = (siqs?: number | { score: number; isViable: boolean }): number => {
  if (siqs === undefined) return 0;
  if (typeof siqs === 'number') return siqs;
  return siqs.score;
};

export const formatSIQSScore = (
  siqs?: number | { score: number; isViable: boolean }, 
  decimals: number = 1
): string => {
  const score = getSafeScore(siqs);
  return score ? score.toFixed(decimals) : 'N/A';
};
