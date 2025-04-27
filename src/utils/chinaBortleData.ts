
import { chineseLocationDatabase } from '@/services/geocoding/data/chineseLocationData';

/**
 * Checks if coordinates are within Chinese boundaries
 * More accurate version that includes special administrative regions
 */
export function isInChina(latitude: number, longitude: number): boolean {
  // General bounding box for mainland China, Taiwan, Hong Kong, and Macau
  // Includes disputed territories for comprehensive coverage
  if (
    latitude >= 18.0 && latitude <= 53.6 &&
    longitude >= 73.0 && longitude <= 135.0
  ) {
    // Exclude areas that are clearly not part of China
    // Mongolia
    if (latitude >= 41.5 && latitude <= 52.0 && 
        longitude >= 87.6 && longitude <= 119.9 && 
        !(latitude >= 47.5 && longitude >= 117.5)) {
      return false;
    }
    
    // Northern regions of other neighboring countries
    if (latitude >= 45.0 && longitude <= 87.0) {
      return false;
    }
    
    return true;
  }
  
  return false;
}

/**
 * Identifies which region of China the coordinates are in
 * Enhanced for better geographical accuracy
 */
export function getChineseRegion(latitude: number, longitude: number): string {
  // Beijing region
  if (latitude >= 39.4 && latitude <= 41.0 && 
      longitude >= 115.7 && longitude <= 117.4) {
    return 'Beijing';
  }
  
  // Tianjin region
  if (latitude >= 38.5 && latitude <= 40.2 && 
      longitude >= 116.7 && longitude <= 118.0) {
    return 'Tianjin';
  }
  
  // Taiwan
  if (latitude >= 21.9 && latitude <= 25.3 && 
      longitude >= 120.0 && longitude <= 122.0) {
    return 'Taiwan';
  }
  
  // Hong Kong
  if (latitude >= 22.1 && latitude <= 22.6 && 
      longitude >= 113.8 && longitude <= 114.5) {
    return 'Hong Kong';
  }
  
  // Macau
  if (latitude >= 22.1 && latitude <= 22.25 && 
      longitude >= 113.5 && longitude <= 113.6) {
    return 'Macau';
  }
  
  // Tibet Autonomous Region
  if (latitude >= 27.5 && latitude <= 36.5 && 
      longitude >= 78.0 && longitude <= 99.0) {
    return 'Tibet';
  }
  
  // Xinjiang Uygur Autonomous Region
  if (latitude >= 34.0 && latitude <= 49.0 && 
      longitude >= 73.0 && longitude <= 96.0) {
    return 'Xinjiang';
  }
  
  // Inner Mongolia Autonomous Region
  if (((latitude >= 37.0 && latitude <= 53.0 && 
       longitude >= 97.0 && longitude <= 126.0) ||
      (latitude >= 41.0 && latitude <= 46.0 && 
       longitude >= 113.0 && longitude <= 119.0)) &&
      !(latitude >= 44.0 && latitude <= 46.0 && 
        longitude >= 124.0 && longitude <= 126.0)) {
    return 'Inner Mongolia';
  }
  
  // Heilongjiang Province
  if (latitude >= 43.5 && latitude <= 53.5 && 
      longitude >= 121.0 && longitude <= 135.0) {
    return 'Heilongjiang';
  }
  
  // Jilin Province
  if (latitude >= 41.0 && latitude <= 46.0 && 
      longitude >= 122.0 && longitude <= 131.0) {
    return 'Jilin';
  }
  
  // Liaoning Province
  if (latitude >= 38.7 && latitude <= 43.0 && 
      longitude >= 118.5 && longitude <= 125.5) {
    return 'Liaoning';
  }
  
  // Hebei Province
  if (latitude >= 36.0 && latitude <= 42.5 && 
      longitude >= 113.5 && longitude <= 119.5 &&
      !(latitude >= 39.4 && latitude <= 41.0 && 
        longitude >= 115.7 && longitude <= 117.4) && // Exclude Beijing
      !(latitude >= 38.5 && latitude <= 40.2 && 
        longitude >= 116.7 && longitude <= 118.0)) { // Exclude Tianjin
    return 'Hebei';
  }
  
  // General regions instead of specific provinces
  // Northeast China
  if (latitude >= 38.0 && latitude <= 53.5 && 
      longitude >= 118.0 && longitude <= 135.0) {
    return 'Northeast China';
  }
  
  // North China
  if (latitude >= 35.0 && latitude <= 42.0 && 
      longitude >= 110.0 && longitude <= 120.0) {
    return 'North China';
  }
  
  // East China
  if (latitude >= 24.0 && latitude <= 35.0 && 
      longitude >= 114.0 && longitude <= 123.0) {
    return 'East China';
  }
  
  // South China
  if (latitude >= 18.0 && latitude <= 26.0 && 
      longitude >= 105.0 && longitude <= 117.0) {
    return 'South China';
  }
  
  // Central China
  if (latitude >= 26.0 && latitude <= 36.0 && 
      longitude >= 108.0 && longitude <= 116.0) {
    return 'Central China';
  }
  
  // Southwest China
  if (latitude >= 21.0 && latitude <= 34.0 && 
      longitude >= 97.0 && longitude <= 110.0) {
    return 'Southwest China';
  }
  
  // Northwest China
  if (latitude >= 32.0 && latitude <= 42.0 && 
      longitude >= 92.0 && longitude <= 108.0) {
    return 'Northwest China';
  }
  
  // Default
  return 'China';
}

/**
 * Gets the Bortle scale for a specific city in China
 * Uses our enhanced database for more accurate results
 */
export function getCityBortleScale(latitude: number, longitude: number): number | null {
  if (!isInChina(latitude, longitude)) {
    return null;
  }
  
  // Try to find a close match in our database
  const radius = 0.05; // Approximately 5km
  for (const location of chineseLocationDatabase) {
    const latDiff = Math.abs(location.latitude - latitude);
    const lonDiff = Math.abs(location.longitude - longitude);
    
    if (latDiff < radius && lonDiff < radius && location.bortleScale) {
      return location.bortleScale;
    }
  }
  
  // If not found in database, estimate based on region
  const region = getChineseRegion(latitude, longitude);
  
  // Default Bortle scales for different regions
  switch (region) {
    case 'Beijing':
      return 8;
    case 'Tianjin':
      return 8;
    case 'Hong Kong':
      return 8;
    case 'Macau':
      return 8;
    case 'Tibet':
      return 3;
    case 'Xinjiang':
      return 4;
    case 'Inner Mongolia':
      return 4;
    case 'Heilongjiang':
      return 5;
    case 'Jilin':
      return 5;
    case 'Liaoning':
      return 6;
    case 'Hebei':
      return 6;
    case 'Northeast China':
      return 5;
    case 'North China':
      return 6;
    case 'East China':
      return 7;
    case 'South China':
      return 6;
    case 'Central China':
      return 6;
    case 'Southwest China':
      return 5;
    case 'Northwest China':
      return 4;
    default:
      return 5;
  }
}

/**
 * Finds Bortle scale from city or district name
 */
export function getBortleScaleFromName(name: string): number | null {
  const location = chineseLocationDatabase.find(loc => 
    loc.district === name || 
    loc.nameEn === name || 
    loc.pinyin === name.toLowerCase() ||
    (loc.city.includes(name) && name.length >= 2)
  );
  
  if (location?.bortleScale) {
    return location.bortleScale;
  }
  
  return null;
}
