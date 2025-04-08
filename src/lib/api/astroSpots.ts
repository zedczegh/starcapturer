
import { SharedAstroSpot as WeatherAstroSpot } from '@/types/weather';

/**
 * Unified AstroSpot interface to avoid type conflicts
 * Compatible with both weather.SharedAstroSpot and other variations
 */
export interface SharedAstroSpot {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  description?: string;
  imageURL?: string;
  rating?: number;
  timestamp?: string;
  chineseName?: string;
  siqs?: number;
  siqsResult?: {
    score: number;
    isViable?: boolean;
    factors?: Array<any>;
    metadata?: {
      calculationType?: string;
      timestamp?: string;
      eveningCloudCover?: number;
      morningCloudCover?: number;
      avgNightCloudCover?: number;
    };
  };
  siqsFactors?: Array<any>;
  distance?: number;
  isViable?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
  weatherData?: {
    temperature?: number;
    humidity?: number;
    cloudCover?: number;
    windSpeed?: number;
    precipitation?: number;
    time?: string;
    condition?: string;
    aqi?: number;
    weatherCondition?: string | number;
  };
}

/**
 * Convert from weather.SharedAstroSpot to the unified SharedAstroSpot
 */
export function normalizeAstroSpot(spot: WeatherAstroSpot | SharedAstroSpot): SharedAstroSpot {
  return {
    ...spot,
    siqs: typeof spot.siqs === 'object' ? spot.siqs.score : spot.siqs,
  };
}

/**
 * Batch normalize an array of AstroSpots
 */
export function normalizeAstroSpots(spots: (WeatherAstroSpot | SharedAstroSpot)[]): SharedAstroSpot[] {
  return spots.map(normalizeAstroSpot);
}

/**
 * Check if a location is valid for astronomy (not on water, etc)
 */
export function isValidAstronomyLocation(
  latitude: number,
  longitude: number,
  name?: string
): boolean {
  // Skip validation for locations with no coordinates
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  
  // Check if it's water
  if (isLikelyWater(latitude, longitude, name)) {
    return false;
  }
  
  return true;
}

/**
 * Check if a location is likely on water
 */
export function isLikelyWater(
  latitude: number, 
  longitude: number,
  name?: string
): boolean {
  // Basic check for oceans by coordinate ranges
  // Pacific Ocean
  if ((longitude > 160 || longitude < -120) && 
      (latitude < 60 && latitude > -60)) {
    return true;
  }
  
  // Atlantic Ocean
  if ((longitude > -80 && longitude < -10) && 
      (latitude < 60 && latitude > -60)) {
    return true;
  }
  
  // Indian Ocean
  if ((longitude > 40 && longitude < 120) && 
      (latitude < 20 && latitude > -60)) {
    return true;
  }
  
  return false;
}

/**
 * Check if location is likely coastal water
 */
export function isLikelyCoastalWater(name?: string): boolean {
  if (!name) return false;
  
  const waterKeywords = [
    'sea', 'ocean', 'lake', 'bay', 'gulf', 'strait', 'channel',
    'reservoir', 'pond', 'dam', 'water', 'marine', 'coastal'
  ];
  
  const lowerName = name.toLowerCase();
  return waterKeywords.some(keyword => lowerName.includes(keyword));
}
