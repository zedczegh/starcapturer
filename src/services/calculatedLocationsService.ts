
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation } from '@/utils/locationValidator';
import { updateLocationsWithRealTimeSiqs } from './realTimeSiqsService/locationUpdateService';

// Cache for calculated locations with improved structure
const calculatedLocationsCache = new Map<string, {
  locations: SharedAstroSpot[];
  timestamp: number;
  radius: number;
}>();

// Global location store to maintain locations between user position changes
const globalLocationStore = new Map<string, SharedAstroSpot>();

// Minimum distance in kilometers between calculated spots to prevent clustering
const MIN_LOCATION_DISTANCE = 2.5; // 2.5km minimum distance between points

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

/**
 * Process calculated locations with optimized chunking and caching
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
  if (cached && 
      Date.now() - cached.timestamp < CACHE_DURATION && 
      cached.radius >= searchRadius) {
    console.log(`Using cached calculated locations for ${cacheKey}`);
    
    // Filter by the current radius if it's smaller than the cached radius
    if (cached.radius > searchRadius) {
      return cached.locations.filter(loc => 
        (loc.distance || 0) <= searchRadius
      );
    }
    
    return cached.locations;
  }
  
  console.log(`Processing ${locations.length} calculated locations with radius ${searchRadius}km`);

  // Combine new locations with existing global locations
  const combinedLocations: SharedAstroSpot[] = [...locations];
  
  // Add any existing locations from the global store that aren't in the new locations
  for (const [key, storedLocation] of globalLocationStore.entries()) {
    // Check if this location already exists in the combinedLocations array
    const exists = combinedLocations.some(loc => {
      if (!loc.latitude || !loc.longitude) return false;
      
      const locKey = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      return locKey === key;
    });
    
    if (!exists) {
      combinedLocations.push(storedLocation);
    }
  }

  // Filter locations by distance and water, maintaining minimum distance between points
  const processedLocations: SharedAstroSpot[] = [];
  
  for (const loc of combinedLocations) {
    // Skip invalid locations
    if (!loc.latitude || !loc.longitude) continue;

    // Skip water locations (unless they're certified sites)
    if (!loc.isDarkSkyReserve && !loc.certification && isWaterLocation(loc.latitude, loc.longitude)) {
      continue;
    }

    // Calculate distance from user location
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      loc.latitude,
      loc.longitude
    );
    
    // Add distance property
    loc.distance = distance;
    
    // Skip if beyond radius
    if (distance > searchRadius) continue;
    
    // For non-certified locations, ensure minimum distance from existing processed points
    if (!loc.isDarkSkyReserve && !loc.certification) {
      // Check distance to all existing processed locations
      const tooClose = processedLocations.some(existingLoc => {
        if (existingLoc.latitude === undefined || existingLoc.longitude === undefined) return false;
        
        const pointDistance = calculateDistance(
          loc.latitude,
          loc.longitude,
          existingLoc.latitude,
          existingLoc.longitude
        );
        
        return pointDistance < MIN_LOCATION_DISTANCE;
      });
      
      // Skip this location if it's too close to an existing one
      if (tooClose) {
        console.log(`Skipping location at ${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)} - too close to existing point`);
        continue;
      }
    }
    
    // Store the location in the global store and add to processed locations
    if (loc.latitude && loc.longitude) {
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      globalLocationStore.set(key, loc);
      processedLocations.push(loc);
    }
  }

  // Process in smaller chunks for better performance
  // This helps prevent overwhelming the API and browser
  const enhancedLocations: SharedAstroSpot[] = [];
  const chunkSize = 10;
  
  for (let i = 0; i < processedLocations.length; i += chunkSize) {
    const chunk = processedLocations.slice(i, i + chunkSize);
    console.log(`Processing chunk ${Math.floor(i/chunkSize) + 1} of ${Math.ceil(processedLocations.length/chunkSize)}`);
    
    const processedChunk = await updateLocationsWithRealTimeSiqs(
      chunk,
      userLocation,
      searchRadius,
      'calculated'
    );
    
    enhancedLocations.push(...processedChunk);
    
    // Update global location store with these enhanced locations
    processedChunk.forEach(loc => {
      if (loc.latitude && loc.longitude) {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        globalLocationStore.set(key, loc);
      }
    });
    
    // Add a small delay between chunks to avoid overwhelming the API
    if (i + chunkSize < processedLocations.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

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
    timestamp: Date.now(),
    radius: searchRadius
  });
  
  // Also store in localStorage for persistence
  try {
    localStorage.setItem(`calculated_locations_${cacheKey}`, JSON.stringify({
      locations: sortedLocations,
      timestamp: Date.now(),
      radius: searchRadius
    }));
  } catch (error) {
    console.error("Error caching calculated locations in localStorage:", error);
  }

  return sortedLocations;
}

/**
 * Clear calculated locations cache
 */
export function clearCalculatedLocationsCache(): void {
  calculatedLocationsCache.clear();
  
  // Don't clear the global location store to maintain locations between position changes
  console.log(`Keeping ${globalLocationStore.size} locations in global store`);
  
  // Only clear from localStorage
  try {
    const keys = Object.keys(localStorage);
    const locationKeys = keys.filter(key => key.startsWith('calculated_locations_'));
    
    locationKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Error clearing calculated locations cache from localStorage:", error);
  }
  
  console.log("Calculated locations cache cleared, but global locations preserved");
}

/**
 * Load cached calculated locations from localStorage
 * This should be called on app initialization
 */
export function loadCalculatedLocationsCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const locationKeys = keys.filter(key => key.startsWith('calculated_locations_'));
    let loadedCount = 0;
    
    locationKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          
          // Add each location to the global store
          parsed.locations.forEach((loc: SharedAstroSpot) => {
            if (loc.latitude && loc.longitude) {
              const locKey = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
              globalLocationStore.set(locKey, loc);
            }
          });
          
          // Only restore if not expired
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            const keyParts = key.replace('calculated_locations_', '').split('-');
            if (keyParts.length >= 3) {
              const cacheKey = `${keyParts[0]}-${keyParts[1]}-${keyParts[2]}`;
              calculatedLocationsCache.set(cacheKey, {
                locations: parsed.locations,
                timestamp: parsed.timestamp,
                radius: parsed.radius || parseInt(keyParts[2], 10) || 100
              });
              loadedCount++;
            }
          }
        }
      } catch (e) {
        console.error(`Error parsing cached calculated location data for key ${key}:`, e);
      }
    });
    
    if (loadedCount > 0) {
      console.log(`Loaded ${loadedCount} calculated location caches from localStorage`);
    }
    
    console.log(`Loaded ${globalLocationStore.size} locations into global store`);
  } catch (error) {
    console.error("Error initializing calculated locations cache:", error);
  }
}

/**
 * Get all stored calculated locations
 * Useful when changing user location to keep existing spots
 */
export function getAllStoredLocations(): SharedAstroSpot[] {
  return Array.from(globalLocationStore.values());
}

/**
 * Add a calculated location to the global store
 * @param location Location to store
 */
export function addLocationToStore(location: SharedAstroSpot): void {
  if (location && location.latitude && location.longitude) {
    const key = `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
    globalLocationStore.set(key, location);
  }
}

// Initialize cache on module load
loadCalculatedLocationsCache();
