
/**
 * Utility functions for the API module
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

/**
 * Determine weather condition based on cloud cover
 */
export function determineWeatherCondition(cloudCover: number): string {
  if (cloudCover < 10) return 'clear';
  if (cloudCover < 30) return 'mostly-clear';
  if (cloudCover < 70) return 'partly-cloudy';
  if (cloudCover < 90) return 'mostly-cloudy';
  return 'cloudy';
}
