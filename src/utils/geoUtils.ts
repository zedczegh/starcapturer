
/**
 * Format SIQS score consistently across the application
 */
export function formatSIQSScore(score: number | undefined | null): string {
  if (score === undefined || score === null) return '—';
  if (score <= 0) return '0';
  return score.toFixed(1);
}

/**
 * Calculate distance between two coordinates in kilometers
 * @param lat1 First latitude
 * @param lon1 First longitude
 * @param lat2 Second latitude
 * @param lon2 Second longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

/**
 * Helper function to convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if location has good viewing conditions based on SIQS
 */
export function isGoodViewingCondition(siqs: number | undefined | null): boolean {
  if (!siqs) return false;
  return siqs >= 6.5;
}
