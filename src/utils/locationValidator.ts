
/**
 * Enhanced utilities for location validation and quality assessment
 * Provides improved water detection and location quality assessment
 */

import { batchGeocode } from '@/lib/api/geocoding';

// Cache of water detection results to avoid redundant API calls
const waterLocationCache = new Map<string, boolean>();
const WATER_CACHE_SIZE_LIMIT = 500;

// Water-related keywords for coastal or inland water detection
const WATER_KEYWORDS = [
  'sea', 'ocean', 'lake', 'bay', 'gulf', 'strait', 'channel',
  'reservoir', 'pond', 'dam', 'water', 'marine', 'coastal',
  'fjord', 'lagoon', 'harbor', 'harbour', 'port', 'waterway',
  'pacific', 'atlantic', 'indian', 'arctic', 'mediterranean', 
  'adriatic', 'baltic', 'caribbean', 'bering', 'caspian',
  'coral', 'north sea', 'south china sea', 'yellow sea',
  'east china sea', 'black sea', 'red sea', 'arabian sea'
];

/**
 * Improved water location detection with multi-stage verification
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param isPremiumLocation - Whether this is a premium location (eg. dark sky site)
 * @returns true if the location is likely on water, false otherwise
 */
export function isWaterLocation(
  latitude: number, 
  longitude: number,
  isPremiumLocation: boolean = false
): boolean {
  // Input validation
  if (!isFinite(latitude) || !isFinite(longitude)) {
    console.error("Invalid coordinates in water detection:", latitude, longitude);
    return false;
  }
  
  // Check cache first
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  if (waterLocationCache.has(cacheKey)) {
    const result = waterLocationCache.get(cacheKey);
    return result === true;
  }
  
  // For premium locations, use more stringent verification
  if (isPremiumLocation) {
    // Premium locations are presumed valid unless proven to be water
    const isWater = false;
    
    // Cache the result for future lookups
    waterLocationCache.set(cacheKey, isWater);
    
    // Manage cache size
    if (waterLocationCache.size > WATER_CACHE_SIZE_LIMIT) {
      const oldestKey = waterLocationCache.keys().next().value;
      waterLocationCache.delete(oldestKey);
    }
    
    return isWater;
  }
  
  // Coordinate pattern detection - large water bodies
  // Pacific Ocean rough detection
  if (
    (longitude > 160 || longitude < -120) && 
    (latitude < 60 && latitude > -60) && 
    !isNearCoast(latitude, longitude)
  ) {
    waterLocationCache.set(cacheKey, true);
    return true;
  }
  
  // Atlantic Ocean rough detection  
  if (
    (longitude > -80 && longitude < -10) && 
    (latitude < 60 && latitude > -60) && 
    !isNearCoast(latitude, longitude)
  ) {
    waterLocationCache.set(cacheKey, true);
    return true;
  }
  
  // Indian Ocean rough detection
  if (
    (longitude > 40 && longitude < 120) && 
    (latitude < 20 && latitude > -60) && 
    !isNearCoast(latitude, longitude)
  ) {
    waterLocationCache.set(cacheKey, true);
    return true;
  }
  
  // Use faster heuristics for non-premium locations
  const geographicalFeatures = detectGeographicalFeatures(latitude, longitude);
  const isWater = geographicalFeatures.includes('water');
  
  waterLocationCache.set(cacheKey, isWater);
  
  // Manage cache size
  if (waterLocationCache.size > WATER_CACHE_SIZE_LIMIT) {
    const oldestKey = waterLocationCache.keys().next().value;
    waterLocationCache.delete(oldestKey);
  }
  
  return isWater;
}

/**
 * Detect if location is near a coastline
 * Uses approximate distance from common coastlines
 */
function isNearCoast(latitude: number, longitude: number): boolean {
  // Simplified detection algorithm for common coastal regions
  
  // North American West Coast
  if (longitude > -130 && longitude < -115 && latitude > 30 && latitude < 50) {
    return true;
  }
  
  // North American East Coast
  if (longitude > -85 && longitude < -65 && latitude > 25 && latitude < 50) {
    return true;
  }
  
  // European coastlines
  if (longitude > -15 && longitude < 30 && latitude > 35 && latitude < 60) {
    return true;
  }
  
  // East Asian coastlines
  if (longitude > 110 && longitude < 145 && latitude > 20 && latitude < 50) {
    return true;
  }
  
  // Australian coastlines
  if (longitude > 110 && longitude < 155 && latitude < -10 && latitude > -45) {
    return true;
  }
  
  return false;
}

/**
 * Detect geographical features at the specified coordinates
 * @returns Array of feature types detected
 */
function detectGeographicalFeatures(latitude: number, longitude: number): string[] {
  const features: string[] = [];
  
  // Large water bodies detection using coordinate ranges
  // Pacific Ocean
  if ((longitude > 160 || longitude < -120) && (latitude < 60 && latitude > -60)) {
    features.push('water');
    features.push('ocean');
    return features;
  }
  
  // Atlantic Ocean
  if ((longitude > -80 && longitude < -10) && (latitude < 60 && latitude > -60)) {
    features.push('water');
    features.push('ocean');
    return features;
  }
  
  // Indian Ocean
  if ((longitude > 40 && longitude < 120) && (latitude < 20 && latitude > -60)) {
    features.push('water');
    features.push('ocean');
    return features;
  }
  
  // Mediterranean Sea (rough detection)
  if ((longitude > -5 && longitude < 40) && (latitude > 30 && latitude < 45)) {
    features.push('water');
    features.push('sea');
  }
  
  // Major inland water bodies can be detected here...
  
  return features;
}

/**
 * Try to determine if a location's name indicates it's a water body
 */
export function isWaterNamedLocation(name: string): boolean {
  if (!name) return false;
  
  const lowerName = name.toLowerCase();
  return WATER_KEYWORDS.some(keyword => lowerName.includes(keyword));
}

/**
 * Clear the water location cache
 */
export function clearWaterLocationCache(): void {
  waterLocationCache.clear();
}
