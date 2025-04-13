
/**
 * Location validation utilities
 * IMPORTANT: These functions validate location data to prevent rendering errors.
 * Any changes should be carefully tested against edge cases.
 */
import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Check if coordinates represent a water location
 * This is a critical function for filtering out unusable spots
 */
export const isWaterLocation = (
  latitude: number, 
  longitude: number,
  isCertified: boolean = false
): boolean => {
  // If it's a certified location, never consider it a water location
  if (isCertified) return false;
  
  // Enhanced water detection algorithm
  
  // Major oceans
  // Pacific Ocean
  if (latitude > -60 && latitude < 60 && 
      ((longitude > 150 || longitude < -120))) {
    return true;
  }
  
  // Atlantic Ocean
  if (latitude > -50 && latitude < 65 && 
      longitude > -80 && longitude < -10) {
    return true;
  }
  
  // Indian Ocean
  if (latitude > -50 && latitude < 30 && 
      longitude > 30 && longitude < 120) {
    return true;
  }
  
  // Mediterranean Sea
  if (latitude > 30 && latitude < 45 && 
      longitude > -5 && longitude < 40) {
    return true;
  }
  
  // South China Sea
  if (latitude > 0 && latitude < 25 && 
      longitude > 105 && longitude < 125) {
    return true;
  }
  
  // Caribbean Sea
  if (latitude > 10 && latitude < 25 && 
      longitude > -85 && longitude < -60) {
    return true;
  }
  
  // Gulf of Mexico
  if (latitude > 18 && latitude < 30 && 
      longitude > -98 && longitude < -82) {
    return true;
  }
  
  // Arabian Sea
  if (latitude > 5 && latitude < 25 && 
      longitude > 50 && longitude < 75) {
    return true;
  }
  
  // Additional regional seas
  
  // Baltic Sea
  if (latitude > 53 && latitude < 66 && 
      longitude > 10 && longitude < 30) {
    return true;
  }
  
  // Black Sea
  if (latitude > 40 && latitude < 48 && 
      longitude > 27 && longitude < 42) {
    return true;
  }
  
  // Red Sea
  if (latitude > 12 && latitude < 30 && 
      longitude > 32 && longitude < 43) {
    return true;
  }
  
  // Great Lakes
  if ((latitude > 41 && latitude < 49 && 
       longitude > -93 && longitude < -76) &&
      // Specific Great Lakes regions
      ((latitude > 41 && latitude < 44 && longitude > -88 && longitude < -82) || // Lake Erie
       (latitude > 43 && latitude < 49 && longitude > -93 && longitude < -82))) { // Other Great Lakes
    return true;
  }
  
  return false;
};

/**
 * Check if a location is likely to be coastal water
 * Enhanced detection for coastal areas
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns boolean indicating if location is likely coastal water
 */
export const isLikelyCoastalWater = (
  latitude: number,
  longitude: number
): boolean => {
  // Enhanced coastal waters detection
  
  // US East Coast
  if (latitude > 25 && latitude < 45 && 
      longitude > -80 && longitude < -70) {
    // Known coastal areas with many water locations
    const knownCoastalPoints = [
      {lat: 40.7, lng: -74.0, radius: 0.4}, // NYC area
      {lat: 42.3, lng: -71.0, radius: 0.4}, // Boston area
      {lat: 38.9, lng: -77.0, radius: 0.3}, // DC area
      {lat: 25.8, lng: -80.2, radius: 0.5}, // Miami area
      {lat: 39.2, lng: -76.5, radius: 0.3}, // Baltimore
      {lat: 29.7, lng: -95.4, radius: 0.5}, // Houston
      {lat: 32.8, lng: -79.9, radius: 0.3}, // Charleston
      {lat: 33.8, lng: -78.7, radius: 0.3}, // Myrtle Beach
    ];
    
    for (const point of knownCoastalPoints) {
      const distance = Math.sqrt(
        Math.pow(latitude - point.lat, 2) + 
        Math.pow(longitude - point.lng, 2)
      );
      
      if (distance < point.radius) {
        return true;
      }
    }
  }
  
  // European coastline
  if (latitude > 36 && latitude < 60 && 
      longitude > -10 && longitude < 20) {
    // Major coastal cities and bays
    const europeanCoastal = [
      {lat: 51.5, lng: -0.1, radius: 0.3}, // London
      {lat: 53.4, lng: -3.0, radius: 0.3}, // Liverpool
      {lat: 43.3, lng: -3.0, radius: 0.3}, // Northern Spain
      {lat: 41.4, lng: 2.2, radius: 0.3}, // Barcelona
      {lat: 43.7, lng: 7.2, radius: 0.2}, // Monaco/Nice
      {lat: 40.8, lng: 14.2, radius: 0.3}, // Naples
      {lat: 37.9, lng: 23.7, radius: 0.3}, // Athens
    ];
    
    for (const point of europeanCoastal) {
      const distance = Math.sqrt(
        Math.pow(latitude - point.lat, 2) + 
        Math.pow(longitude - point.lng, 2)
      );
      
      if (distance < point.radius) {
        return true;
      }
    }
  }
  
  // East Asian coastlines
  if (latitude > 20 && latitude < 45 && 
      longitude > 110 && longitude < 145) {
    // Major coastal cities
    const asianCoastal = [
      {lat: 35.6, lng: 139.8, radius: 0.3}, // Tokyo Bay
      {lat: 31.2, lng: 121.5, radius: 0.3}, // Shanghai
      {lat: 22.3, lng: 114.2, radius: 0.3}, // Hong Kong
      {lat: 37.6, lng: 126.8, radius: 0.2}, // Seoul/Incheon
      {lat: 35.2, lng: 129.0, radius: 0.2}, // Busan
    ];
    
    for (const point of asianCoastal) {
      const distance = Math.sqrt(
        Math.pow(latitude - point.lat, 2) + 
        Math.pow(longitude - point.lng, 2)
      );
      
      if (distance < point.radius) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Check if a location is valid for astronomy viewing
 * Combines multiple checks to filter out unusable spots
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param locationName Optional location name for additional checks
 * @returns boolean indicating if location is valid for astronomy
 */
export const isValidAstronomyLocation = (
  latitude: number, 
  longitude: number,
  locationName?: string
): boolean => {
  // Must have valid coordinates
  if (typeof latitude !== 'number' || 
      typeof longitude !== 'number' ||
      !isFinite(latitude) || 
      !isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180) {
    return false;
  }
  
  // Check if it's a water location
  if (isWaterLocation(latitude, longitude)) {
    return false;
  }
  
  // Check if it's likely coastal water
  if (isLikelyCoastalWater(latitude, longitude)) {
    return false;
  }
  
  // If location has a name that suggests water (optional check)
  if (locationName) {
    const lowerName = locationName.toLowerCase();
    const waterKeywords = [
      'ocean', 'sea', 'bay', 'gulf', 'lake', 'strait', 
      'channel', 'sound', 'harbor', 'harbour', 'port', 
      'pier', 'marina', 'lagoon', 'reservoir', 'fjord', 
      'canal', 'pond', 'basin', 'cove', 'inlet', 'beach'
    ];
    
    for (const keyword of waterKeywords) {
      if (lowerName.includes(keyword)) {
        return false;
      }
    }
  }
  
  // All checks passed
  return true;
};

/**
 * Validate location coordinates are within valid ranges
 * @param location Location to validate
 * @returns boolean indicating if location is valid
 */
export const hasValidCoordinates = (location: SharedAstroSpot): boolean => {
  return Boolean(
    location && 
    typeof location.latitude === 'number' && 
    typeof location.longitude === 'number' &&
    isFinite(location.latitude) &&
    isFinite(location.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180
  );
};

/**
 * Create a unique ID for a location
 * @param location Location to create ID for
 * @returns string ID
 */
export const getLocationId = (location: SharedAstroSpot): string => {
  return location.id || 
    `location-${location.latitude?.toFixed(6)}-${location.longitude?.toFixed(6)}`;
};

/**
 * Check if a location is a certified dark sky location
 * @param location Location to check
 * @returns boolean indicating if location is certified
 */
export const isCertifiedLocation = (location: SharedAstroSpot): boolean => {
  return location.isDarkSkyReserve === true || 
    (location.certification && location.certification !== '');
};
