
import { calculateDistance, haversineDistance } from './geoUtils';

// Re-export for backwards compatibility
export { calculateDistance, haversineDistance };

/**
 * Calculate the midpoint between two coordinates
 */
export const calculateMidpoint = (lat1: number, lon1: number, lat2: number, lon2: number): [number, number] => {
  const dLon = deg2rad(lon2 - lon1);
  
  const lat1Rad = deg2rad(lat1);
  const lat2Rad = deg2rad(lat2);
  const lon1Rad = deg2rad(lon1);
  
  const Bx = Math.cos(lat2Rad) * Math.cos(dLon);
  const By = Math.cos(lat2Rad) * Math.sin(dLon);
  
  const midLat = Math.atan2(
    Math.sin(lat1Rad) + Math.sin(lat2Rad),
    Math.sqrt((Math.cos(lat1Rad) + Bx) * (Math.cos(lat1Rad) + Bx) + By * By)
  );
  
  const midLon = lon1Rad + Math.atan2(By, Math.cos(lat1Rad) + Bx);
  
  return [rad2deg(midLat), rad2deg(midLon)];
};

/**
 * Convert radians to degrees
 */
const rad2deg = (rad: number): number => {
  return rad * (180 / Math.PI);
};

/**
 * Convert degrees to radians
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};
