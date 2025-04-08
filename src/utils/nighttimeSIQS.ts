
/**
 * Utility functions for handling nighttime SIQS values
 */

/**
 * Extract a consistent SIQS value regardless of how it's stored in the location object
 * @param location Location object which might have siqs in different formats
 * @returns The SIQS score as a number or null if not available
 */
export const getConsistentSiqsValue = (location: any): number | null => {
  if (!location) return null;
  
  // Direct siqs property
  if (typeof location.siqs === 'number') {
    return location.siqs;
  }
  
  // SIQS in siqsResult object
  if (location.siqsResult) {
    if (typeof location.siqsResult === 'number') {
      return location.siqsResult;
    }
    if (typeof location.siqsResult.score === 'number') {
      return location.siqsResult.score;
    }
  }
  
  // SIQS in result object (alternative format)
  if (location.result && typeof location.result.siqs === 'number') {
    return location.result.siqs;
  }
  
  return null;
};

/**
 * Calculate the average of multiple SIQS values
 * @param siqsValues Array of SIQS values
 * @returns Average SIQS or null if no valid values
 */
export const calculateAverageSiqs = (siqsValues: (number | null)[]): number | null => {
  if (!siqsValues || siqsValues.length === 0) return null;
  
  const validValues = siqsValues.filter(v => v !== null && !isNaN(v as number)) as number[];
  if (validValues.length === 0) return null;
  
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return sum / validValues.length;
};

/**
 * Get nighttime SIQS from a location that might have daytime and nighttime values
 * @param location Location object
 * @returns Nighttime SIQS value if available
 */
export const getNighttimeSiqs = (location: any): number | null => {
  if (!location) return null;
  
  // Check for nighttime specific data
  if (location.nighttimeSiqs !== undefined) {
    return typeof location.nighttimeSiqs === 'number' ? location.nighttimeSiqs : null;
  }
  
  // Check extended result structure
  if (location.siqsResult?.metadata?.isNighttimeCalculation) {
    return location.siqsResult.score || null;
  }
  
  // Fall back to general SIQS
  return getConsistentSiqsValue(location);
};
