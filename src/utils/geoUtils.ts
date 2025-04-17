/**
 * Utility functions for geographic calculations and formatting
 */

// Format distance in a user-friendly way
export function formatDistance(distance: number): string {
  if (distance === undefined || distance === null) {
    return 'Unknown distance';
  }
  
  if (distance < 1) {
    // Convert to meters
    return `${Math.round(distance * 1000)}m`;
  }
  
  // Otherwise, show in kilometers with one decimal place
  return `${distance.toFixed(1)}km`;
}

// Format SIQS score in a user-friendly way
export function formatSIQSScore(score: number): string {
  if (score === undefined || score === null) {
    return '-';
  }
  
  // Format to one decimal place
  return score.toFixed(1);
}

// Convert degrees to radians
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Get safe SIQS score (handle edge cases)
export function getSafeScore(location: any): number {
  // Handle different formats of SIQS scores in the data
  if (location.siqsResult && typeof location.siqsResult.siqs === 'number') {
    return location.siqsResult.siqs;
  }
  
  if (typeof location.siqs === 'number') {
    return location.siqs;
  }
  
  // For certified locations with no score, use a good default
  if (location.certification || location.isDarkSkyReserve || location.type === 'dark-site') {
    return 7.5;
  }
  
  return 0; // Default for unknown scores
}

// Haversine formula to calculate distance between two points
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Export haversineDistance as calculateDistance for backward compatibility
export const calculateDistance = haversineDistance;
