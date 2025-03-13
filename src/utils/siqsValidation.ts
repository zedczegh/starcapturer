
/**
 * Validate input parameters for SIQS calculation
 */
export const validateInputs = (
  locationName: string, 
  latitude: string, 
  longitude: string, 
  language: string
): boolean => {
  if (!locationName.trim()) {
    return false;
  }
  
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (isNaN(lat) || lat < -90 || lat > 90) {
    return false;
  }
  
  if (isNaN(lng) || lng < -180 || lng > 180) {
    return false;
  }
  
  return true;
};

/**
 * Calculate moon phase based on date
 * Returns a value between 0-1 representing the moon phase
 */
export const calculateMoonPhase = (): number => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const c = 365.25 * year;
  const e = 30.6 * month;
  const jd = c + e + day - 694039.09;
  return (jd % 29.53) / 29.53;
};
