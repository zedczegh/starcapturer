
/**
 * Format a SIQS score for display
 * @param siqs SIQS score
 * @returns Formatted SIQS score string
 */
export const formatSIQSScore = (siqs: number | null | undefined): string => {
  if (siqs === null || siqs === undefined) return "N/A";
  
  // Format to one decimal place
  return siqs.toFixed(1);
};

/**
 * Format a Bortle scale value for display
 * @param bortleScale Bortle scale value
 * @returns Formatted Bortle scale string
 */
export const formatBortleScale = (bortleScale: number | null): string => {
  if (bortleScale === null) return "N/A";
  
  return bortleScale.toString();
};

/**
 * Format coordinates for display
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Formatted coordinates string
 */
export const formatCoordinates = (latitude: number, longitude: number): string => {
  const lat = Math.abs(latitude).toFixed(5) + (latitude >= 0 ? '°N' : '°S');
  const lng = Math.abs(longitude).toFixed(5) + (longitude >= 0 ? '°E' : '°W');
  
  return `${lat}, ${lng}`;
};
