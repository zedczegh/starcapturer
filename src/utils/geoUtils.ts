
/**
 * Geography utilities for astronomy applications
 */
import { haversine } from './haversine';

/**
 * Format a distance for display, with appropriate units
 * @param distance Distance in kilometers
 * @param language Language code ('en' or 'zh')
 * @returns Formatted distance string
 */
export function formatDistance(distance?: number, language: string = 'en'): string {
  if (distance === undefined || distance === null) {
    return '';
  }
  
  // Round to 1 decimal place
  const roundedDistance = Math.round(distance * 10) / 10;

  if (language === 'zh') {
    return `${roundedDistance} 公里`;
  } else {
    // Convert to miles for English
    const miles = distance * 0.621371;
    const roundedMiles = Math.round(miles * 10) / 10;
    return `${roundedMiles} mi`;
  }
}

/**
 * Format SIQS score for display
 * @param siqs SIQS score or object with score property
 * @returns Formatted SIQS score string
 */
export function formatSIQSScore(siqs: number | { score: number } | undefined): string {
  if (siqs === undefined || siqs === null) {
    return 'N/A';
  }
  
  // Extract the score from object if needed
  const score = typeof siqs === 'number' ? siqs : siqs.score;
  
  // Format to one decimal place
  return score.toFixed(1);
}

/**
 * Calculate distance between two locations
 * @param lat1 First location latitude
 * @param lon1 First location longitude
 * @param lat2 Second location latitude
 * @param lon2 Second location longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversine(lat1, lon1, lat2, lon2);
}

/**
 * Get SIQS score from various formats
 * @param siqs SIQS value in different formats
 * @returns Numeric SIQS score or 0 if invalid
 */
export function getSiqsScore(siqs: number | { score: number } | undefined): number {
  if (siqs === undefined || siqs === null) {
    return 0;
  }
  
  if (typeof siqs === 'number') {
    return siqs;
  }
  
  if (typeof siqs === 'object' && siqs !== null && 'score' in siqs) {
    return siqs.score;
  }
  
  return 0;
}
