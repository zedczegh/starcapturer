
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
  // Pacific Ocean (expanded coverage)
  if (latitude > -65 && latitude < 65 && 
      ((longitude > 145 || longitude < -125))) {
    return true;
  }
  
  // Atlantic Ocean (expanded coverage)
  if (latitude > -55 && latitude < 70 && 
      longitude > -85 && longitude < -5) {
    return true;
  }
  
  // Indian Ocean (expanded coverage)
  if (latitude > -55 && latitude < 35 && 
      longitude > 25 && longitude < 125) {
    return true;
  }
  
  // Mediterranean Sea (expanded coverage)
  if (latitude > 28 && latitude < 47 && 
      longitude > -7 && longitude < 42) {
    return true;
  }
  
  // South China Sea (expanded coverage)
  if (latitude > -2 && latitude < 27 && 
      longitude > 103 && longitude < 127) {
    return true;
  }
  
  // Caribbean Sea (expanded coverage)
  if (latitude > 8 && latitude < 27 && 
      longitude > -87 && longitude < -58) {
    return true;
  }
  
  // Gulf of Mexico (expanded coverage)
  if (latitude > 16 && latitude < 32 && 
      longitude > -100 && longitude < -80) {
    return true;
  }
  
  // Arabian Sea (expanded coverage)
  if (latitude > 3 && latitude < 27 && 
      longitude > 48 && longitude < 77) {
    return true;
  }
  
  // Additional regional seas
  
  // Baltic Sea (expanded coverage)
  if (latitude > 51 && latitude < 68 && 
      longitude > 8 && longitude < 32) {
    return true;
  }
  
  // Black Sea (expanded coverage)
  if (latitude > 38 && latitude < 50 && 
      longitude > 25 && longitude < 44) {
    return true;
  }
  
  // Red Sea (expanded coverage)
  if (latitude > 10 && latitude < 32 && 
      longitude > 30 && longitude < 45) {
    return true;
  }
  
  // Great Lakes (expanded coverage)
  if ((latitude > 39 && latitude < 51 && 
       longitude > -95 && longitude < -74) &&
      // Specific Great Lakes regions
      ((latitude > 39 && latitude < 46 && longitude > -89 && longitude < -80) || // Lake Erie & Ontario
       (latitude > 41 && latitude < 51 && longitude > -95 && longitude < -80))) { // Other Great Lakes
    return true;
  }
  
  // Additional water bodies
  
  // Caspian Sea
  if (latitude > 36 && latitude < 48 && 
      longitude > 46 && longitude < 56) {
    return true;
  }
  
  // Bay of Bengal
  if (latitude > 5 && latitude < 24 && 
      longitude > 80 && longitude < 95) {
    return true;
  }
  
  // Yellow Sea & East China Sea
  if (latitude > 24 && latitude < 41 && 
      longitude > 118 && longitude < 130) {
    return true;
  }
  
  // Sea of Japan
  if (latitude > 33 && latitude < 48 && 
      longitude > 127 && longitude < 142) {
    return true;
  }
  
  // North Sea
  if (latitude > 51 && latitude < 62 && 
      longitude > -4 && longitude < 9) {
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
  
  // US East Coast (expanded)
  if (latitude > 23 && latitude < 47 && 
      longitude > -82 && longitude < -68) {
    // Known coastal areas with many water locations
    const knownCoastalPoints = [
      {lat: 40.7, lng: -74.0, radius: 0.5}, // NYC area
      {lat: 42.3, lng: -71.0, radius: 0.5}, // Boston area
      {lat: 38.9, lng: -77.0, radius: 0.4}, // DC area
      {lat: 25.8, lng: -80.2, radius: 0.6}, // Miami area
      {lat: 39.2, lng: -76.5, radius: 0.4}, // Baltimore
      {lat: 29.7, lng: -95.4, radius: 0.6}, // Houston
      {lat: 32.8, lng: -79.9, radius: 0.4}, // Charleston
      {lat: 33.8, lng: -78.7, radius: 0.4}, // Myrtle Beach
      {lat: 41.5, lng: -71.3, radius: 0.4}, // Rhode Island
      {lat: 43.0, lng: -70.7, radius: 0.4}, // Portsmouth
      {lat: 37.5, lng: -76.0, radius: 0.5}, // Chesapeake Bay
      {lat: 27.8, lng: -82.5, radius: 0.5}, // Tampa
      {lat: 30.3, lng: -81.6, radius: 0.4}, // Jacksonville
      {lat: 32.1, lng: -81.1, radius: 0.4}, // Savannah
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
  
  // US West Coast (new)
  if (latitude > 32 && latitude < 49 && 
      longitude > -125 && longitude < -117) {
    // Major coastal cities and bays
    const westCoastPoints = [
      {lat: 37.8, lng: -122.4, radius: 0.6}, // San Francisco
      {lat: 34.0, lng: -118.5, radius: 0.6}, // Los Angeles
      {lat: 32.7, lng: -117.2, radius: 0.5}, // San Diego
      {lat: 47.6, lng: -122.3, radius: 0.5}, // Seattle
      {lat: 45.5, lng: -122.7, radius: 0.5}, // Portland
      {lat: 38.3, lng: -123.0, radius: 0.4}, // Bodega Bay
      {lat: 36.6, lng: -121.9, radius: 0.4}, // Monterey
      {lat: 35.4, lng: -120.9, radius: 0.4}, // Morro Bay
      {lat: 33.7, lng: -118.2, radius: 0.5}, // Long Beach
      {lat: 33.6, lng: -117.9, radius: 0.4}, // Newport Beach
    ];
    
    for (const point of westCoastPoints) {
      const distance = Math.sqrt(
        Math.pow(latitude - point.lat, 2) + 
        Math.pow(longitude - point.lng, 2)
      );
      
      if (distance < point.radius) {
        return true;
      }
    }
  }
  
  // European coastline (expanded)
  if (latitude > 34 && latitude < 62 && 
      longitude > -12 && longitude < 22) {
    // Major coastal cities and bays
    const europeanCoastal = [
      {lat: 51.5, lng: -0.1, radius: 0.4}, // London
      {lat: 53.4, lng: -3.0, radius: 0.4}, // Liverpool
      {lat: 43.3, lng: -3.0, radius: 0.4}, // Northern Spain
      {lat: 41.4, lng: 2.2, radius: 0.4}, // Barcelona
      {lat: 43.7, lng: 7.2, radius: 0.3}, // Monaco/Nice
      {lat: 40.8, lng: 14.2, radius: 0.4}, // Naples
      {lat: 37.9, lng: 23.7, radius: 0.4}, // Athens
      {lat: 55.7, lng: 12.6, radius: 0.4}, // Copenhagen
      {lat: 59.3, lng: 18.1, radius: 0.4}, // Stockholm
      {lat: 60.2, lng: 24.9, radius: 0.4}, // Helsinki
      {lat: 38.7, lng: -9.1, radius: 0.4}, // Lisbon
      {lat: 36.8, lng: -6.3, radius: 0.4}, // Cadiz
      {lat: 43.5, lng: -8.2, radius: 0.4}, // La Coruña
      {lat: 47.2, lng: -1.6, radius: 0.4}, // Nantes
      {lat: 50.8, lng: -1.1, radius: 0.4}, // Portsmouth UK
      {lat: 48.6, lng: 2.4, radius: 0.4}, // Le Havre
      {lat: 53.5, lng: 10.0, radius: 0.4}, // Hamburg
      {lat: 43.3, lng: 5.4, radius: 0.4}, // Marseille
      {lat: 45.4, lng: 12.3, radius: 0.4}, // Venice
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
  
  // East Asian coastlines (expanded)
  if (latitude > 18 && latitude < 47 && 
      longitude > 108 && longitude < 147) {
    // Major coastal cities
    const asianCoastal = [
      {lat: 35.6, lng: 139.8, radius: 0.4}, // Tokyo Bay
      {lat: 31.2, lng: 121.5, radius: 0.4}, // Shanghai
      {lat: 22.3, lng: 114.2, radius: 0.4}, // Hong Kong
      {lat: 37.6, lng: 126.8, radius: 0.3}, // Seoul/Incheon
      {lat: 35.2, lng: 129.0, radius: 0.3}, // Busan
      {lat: 34.7, lng: 135.5, radius: 0.4}, // Osaka
      {lat: 25.0, lng: 121.5, radius: 0.4}, // Taipei
      {lat: 1.3, lng: 103.8, radius: 0.4}, // Singapore
      {lat: 13.7, lng: 100.5, radius: 0.4}, // Bangkok
      {lat: 10.8, lng: 106.7, radius: 0.4}, // Ho Chi Minh
      {lat: 14.6, lng: 120.9, radius: 0.4}, // Manila
      {lat: 39.1, lng: 117.2, radius: 0.4}, // Tianjin
      {lat: 23.1, lng: 113.3, radius: 0.4}, // Guangzhou
      {lat: 38.9, lng: 121.6, radius: 0.4}, // Dalian
      {lat: 36.4, lng: 120.4, radius: 0.4}, // Qingdao
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
  
  // If location has a name that suggests water (expanded list)
  if (locationName) {
    const lowerName = locationName.toLowerCase();
    const waterKeywords = [
      'ocean', 'sea', 'bay', 'gulf', 'lake', 'strait', 
      'channel', 'sound', 'harbor', 'harbour', 'port', 
      'pier', 'marina', 'lagoon', 'reservoir', 'fjord', 
      'canal', 'pond', 'basin', 'cove', 'inlet', 'beach',
      'water', 'river', 'stream', 'creek', 'estuary', 'shore',
      'waterway', 'waterfront', 'quay', 'dock', 'jetty', 'ferry',
      'wharf', 'dam', 'boating', 'maritime', 'cruise', 'sailing',
      'coastline', 'coastal', 'seashore', 'oceanfront', 'bayfront'
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
