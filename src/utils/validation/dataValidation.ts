
/**
 * Validates SIQS data structure to ensure it's consistent
 * @param siqsData The SIQS data object to validate
 * @returns Boolean indicating if the data is valid
 */
export const validateSIQSData = (siqsData: any): boolean => {
  // Allow null SIQS data - component will handle this case
  if (siqsData === null || siqsData === undefined) {
    return false;
  }
  
  // Handle case where it's just a number
  if (typeof siqsData === 'number') {
    return true;
  }
  
  // Handle case where it's a simple object with just a score property
  if (typeof siqsData === 'object' && typeof siqsData.score === 'number') {
    return true;
  }
  
  // Handle nested siqsResult case
  if (typeof siqsData === 'object' && siqsData.siqsResult) {
    return validateSIQSData(siqsData.siqsResult);
  }
  
  return false;
};

/**
 * Validates location data structure
 * @param locationData Location data to validate
 * @returns Boolean indicating if the data is valid
 */
export const validateLocationData = (locationData: any): boolean => {
  if (!locationData) return false;
  
  // Basic required fields
  return (
    typeof locationData === 'object' &&
    typeof locationData.latitude === 'number' &&
    typeof locationData.longitude === 'number' &&
    isFinite(locationData.latitude) &&
    isFinite(locationData.longitude)
  );
};

