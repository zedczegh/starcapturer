import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation } from '@/utils/locationValidator';
import { updateLocationsWithRealTimeSiqs } from './realTimeSiqsService/locationUpdateService';

// Cache for calculated locations
const calculatedLocationsCache = new Map<string, {
  locations: SharedAstroSpot[];
  timestamp: number;
}>();

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Process calculated locations with optimized performance
 * @param locations Raw locations data
 * @param userLocation Current user location
 * @param searchRadius Search radius in km
 * @returns Processed and filtered locations
 */
export async function processCalculatedLocations(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number
): Promise<SharedAstroSpot[]> {
  if (!userLocation || !locations.length) {
    return [];
  }

  // Generate cache key
  const cacheKey = `${userLocation.latitude.toFixed(3)}-${userLocation.longitude.toFixed(3)}-${searchRadius}`;
  
  // Check cache
  const cached = calculatedLocationsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached calculated locations for ${cacheKey}`);
    return cached.locations;
  }
  
  console.log(`Processing ${locations.length} calculated locations`);

  // Filter locations by distance and water
  const filteredLocations = locations.filter(loc => {
    // Skip invalid locations
    if (!loc.latitude || !loc.longitude) return false;

    // Skip water locations
    if (!loc.isDarkSkyReserve && !loc.certification && isWaterLocation(loc.latitude, loc.longitude)) {
      return false;
    }

    // Check distance
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      loc.latitude,
      loc.longitude
    );
    
    // Add distance property
    loc.distance = distance;
    
    // Keep if within radius
    return distance <= searchRadius;
  });

  // Enhance with real-time SIQS
  const enhancedLocations = await updateLocationsWithRealTimeSiqs(
    filteredLocations,
    userLocation,
    searchRadius,
    'calculated'
  );

  // Sort by SIQS and distance
  const sortedLocations = enhancedLocations.sort((a, b) => {
    // If both have SIQS, sort by SIQS
    if (a.siqs && b.siqs) {
      return b.siqs - a.siqs;
    }
    
    // If only one has SIQS, that one goes first
    if (a.siqs && !b.siqs) return -1;
    if (!a.siqs && b.siqs) return 1;
    
    // Otherwise sort by distance
    return (a.distance || 999) - (b.distance || 999);
  });

  // Cache the result
  calculatedLocationsCache.set(cacheKey, {
    locations: sortedLocations,
    timestamp: Date.now()
  });

  return sortedLocations;
}

/**
 * Clear calculated locations cache
 */
export function clearCalculatedLocationsCache(): void {
  calculatedLocationsCache.clear();
  console.log("Calculated locations cache cleared");
}
