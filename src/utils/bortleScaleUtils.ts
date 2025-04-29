
/**
 * Utility functions for Bortle scale calculations
 */

/**
 * Get the Bortle scale value for a location based on its coordinates
 * 
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @returns Bortle scale value (1-9)
 */
export function getBortleScaleForLocation(latitude: number, longitude: number): number {
  // This is a simplified implementation
  // In a real app, this would query light pollution databases
  
  // Get distance from major cities as a factor
  const distanceFromUrbanCenters = Math.abs(Math.sin(latitude) * Math.cos(longitude) * 5);
  
  // Higher latitude generally means less population density
  const latitudeFactor = Math.abs(latitude) / 90;
  
  // Calculate a base Bortle value (1-9 scale)
  let bortleValue = 9 - (distanceFromUrbanCenters + latitudeFactor) * 4;
  
  // Ensure the value is within the valid range
  bortleValue = Math.max(1, Math.min(9, bortleValue));
  
  return Math.round(bortleValue);
}
