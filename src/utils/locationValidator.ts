
import { Coordinates } from '@/lib/api/coordinates';

/**
 * Check if coordinates are within a valid range
 * @param latitude Latitude to validate
 * @param longitude Longitude to validate
 * @returns Boolean indicating if coordinates are valid
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 && latitude <= 90 && 
    longitude >= -180 && longitude <= 180
  );
}

/**
 * Check if a location is in a water area
 * Based on simplified geographic data for major water bodies
 * @param latitude Latitude to check
 * @param longitude Longitude to check
 * @returns Boolean indicating if location is likely in water
 */
export function isWaterLocation(latitude: number, longitude: number): boolean {
  // This is a simplified check - in a real app you might use GeoJSON data
  // for more accurate water body detection
  
  // Pacific Ocean - simplified boundary
  if (longitude < -120 && longitude > -180 && latitude > -60 && latitude < 60) {
    return true;
  }
  
  // Atlantic Ocean - simplified boundary
  if (longitude > -75 && longitude < 0 && latitude > -60 && latitude < 70) {
    return true;
  }
  
  // Indian Ocean - simplified boundary
  if (longitude > 40 && longitude < 100 && latitude > -50 && latitude < 25) {
    return true;
  }
  
  // Arctic Ocean - simplified boundary
  if (latitude > 70) {
    return true;
  }
  
  // Antarctic Ocean - simplified boundary
  if (latitude < -60) {
    return true;
  }
  
  // Mediterranean Sea - simplified boundary
  if (longitude > 0 && longitude < 40 && latitude > 30 && latitude < 45) {
    return true;
  }
  
  // Add more water bodies as needed
  
  return false;
}

/**
 * Check if a location is in a remote area
 * @param latitude Latitude to check
 * @param longitude Longitude to check
 * @returns Boolean indicating if location is likely in a remote area
 */
export function isRemoteLocation(latitude: number, longitude: number): boolean {
  // This would typically use a more sophisticated algorithm or API
  // For now, just check some known remote regions
  
  // Remote areas in Sahara Desert
  if (longitude > -15 && longitude < 35 && latitude > 15 && latitude < 30) {
    return true;
  }
  
  // Remote areas in Siberia
  if (longitude > 60 && longitude < 180 && latitude > 60 && latitude < 75) {
    return true;
  }
  
  // Remote areas in Australian Outback
  if (longitude > 120 && longitude < 140 && latitude < -25 && latitude > -35) {
    return true;
  }
  
  // Tibet/Himalayan region
  if (longitude > 80 && longitude < 95 && latitude > 30 && latitude < 35) {
    return true;
  }
  
  // Add more remote regions as needed
  
  return false;
}

/**
 * Validate coordinates and correct if needed
 * @param coords Coordinates to validate
 * @returns Corrected coordinates
 */
export function validateAndCorrectCoordinates(coords: Coordinates): Coordinates {
  let { latitude, longitude } = coords;
  
  // Correct latitude if out of range
  latitude = Math.max(-90, Math.min(90, latitude));
  
  // Normalize longitude to -180 to 180 range
  while (longitude > 180) longitude -= 360;
  while (longitude < -180) longitude += 360;
  
  return { latitude, longitude };
}
