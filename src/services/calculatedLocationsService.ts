
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation } from '@/utils/locationValidator';
import { estimateTerrainType } from '@/utils/locationClassifier';
import { updateLocationsWithRealTimeSiqs } from './realTimeSiqsService/locationUpdateService';

// Enhanced cache for calculated locations with improved structure
const calculatedLocationsCache = new Map<string, {
  locations: SharedAstroSpot[];
  timestamp: number;
  radius: number;
}>();

// Global location store to maintain locations between user position changes
const globalLocationStore = new Map<string, SharedAstroSpot>();

// Terrain-specific minimum distance settings to prevent clustering
const MIN_LOCATION_DISTANCE = {
  default: 2.5,  // 2.5km minimum distance between points
  mountain: 3.5, // Mountains need more spacing due to terrain variation
  desert: 5.0,   // Desert areas are more open, need more spacing
  urban: 1.5,    // Urban areas can be closer together
  coastal: 2.0   // Coastal areas standard spacing
};

// Adaptive cache duration in milliseconds based on location type
const CACHE_DURATION = {
  default: 30 * 60 * 1000,       // 30 minutes
  stable: 6 * 60 * 60 * 1000,    // 6 hours for stable locations
  highQuality: 12 * 60 * 60 * 1000 // 12 hours for high quality data
};

/**
 * Process calculated locations with advanced algorithms for optimal results
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

  // Generate cache key with more precision for targeted caching
  const cacheKey = `${userLocation.latitude.toFixed(3)}-${userLocation.longitude.toFixed(3)}-${searchRadius}`;
  
  // Check cache with intelligent expiration
  const cached = calculatedLocationsCache.get(cacheKey);
  if (cached && 
      Date.now() - cached.timestamp < getCacheDuration(userLocation) && 
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

  // Enhanced filtering with terrain-aware spacing
  const processedLocations: SharedAstroSpot[] = [];
  
  // Group locations by cells for more efficient processing
  const gridCells = groupLocationsByGrid(combinedLocations, 0.5); // 0.5 degree grid cells
  
  // Process each grid cell separately for better performance
  for (const cell of gridCells) {
    // Process locations within this cell
    for (const loc of cell) {
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
      
      // Estimate terrain type for adaptive spacing
      const terrainType = estimateTerrainType(loc.latitude, loc.longitude);
      let minDistance = MIN_LOCATION_DISTANCE.default;
      
      // Adapt minimum distance based on terrain type
      switch(terrainType) {
        case 'mountain':
          minDistance = MIN_LOCATION_DISTANCE.mountain;
          break;
        case 'desert':
          minDistance = MIN_LOCATION_DISTANCE.desert;
          break;
        case 'coastal':
          minDistance = MIN_LOCATION_DISTANCE.coastal;
          break;
        case 'urban':
          minDistance = MIN_LOCATION_DISTANCE.urban;
          break;
      }
      
      // For certified locations, bypass spacing requirements
      if (loc.isDarkSkyReserve || loc.certification) {
        processedLocations.push(loc);
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          globalLocationStore.set(key, loc);
        }
        continue;
      }
      
      // Check distance to all existing processed locations with terrain-aware spacing
      const tooClose = processedLocations.some(existingLoc => {
        if (existingLoc.latitude === undefined || existingLoc.longitude === undefined) return false;
        
        const pointDistance = calculateDistance(
          loc.latitude,
          loc.longitude,
          existingLoc.latitude,
          existingLoc.longitude
        );
        
        return pointDistance < minDistance;
      });
      
      // Skip this location if it's too close to an existing one
      if (tooClose) {
        continue;
      }
      
      // Store the location in the global store and add to processed locations
      if (loc.latitude && loc.longitude) {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        globalLocationStore.set(key, loc);
        processedLocations.push(loc);
      }
    }
  }

  // Enhanced batch processing with adaptive chunk sizes
  const enhancedLocations: SharedAstroSpot[] = [];
  const devicePerformance = estimateDevicePerformance();
  
  // Adjust chunk size based on device performance
  const chunkSize = devicePerformance === 'high' ? 15 : 
                   devicePerformance === 'medium' ? 10 : 5;
  
  // Process in smaller chunks for better performance
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
    // Only delay if there are more chunks to process
    if (i + chunkSize < processedLocations.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Advanced sorting with multiple criteria for better user experience
  const sortedLocations = enhancedLocations.sort((a, b) => {
    // First prioritize certified locations
    if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
      return -1;
    }
    if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
      return 1;
    }
    
    // Then sort by SIQS if available
    if (a.siqs && b.siqs) {
      return b.siqs - a.siqs;
    }
    
    // If only one has SIQS, that one goes first
    if (a.siqs && !b.siqs) return -1;
    if (!a.siqs && b.siqs) return 1;
    
    // Otherwise sort by distance
    return (a.distance || 999) - (b.distance || 999);
  });

  // Cache the result with intelligent expiration
  calculatedLocationsCache.set(cacheKey, {
    locations: sortedLocations,
    timestamp: Date.now(),
    radius: searchRadius
  });
  
  // Also store in localStorage for persistence with size and quota management
  try {
    const storageKey = `calculated_locations_${cacheKey}`;
    
    // Check for previous cached locations to manage storage quota
    const previousKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('calculated_locations_') && key !== storageKey
    );
    
    // If we have too many cached locations, remove the oldest ones
    if (previousKeys.length > 10) {
      // Sort by timestamp (oldest first)
      previousKeys.sort((a, b) => {
        try {
          const dataA = JSON.parse(localStorage.getItem(a) || '{}');
          const dataB = JSON.parse(localStorage.getItem(b) || '{}');
          return (dataA.timestamp || 0) - (dataB.timestamp || 0);
        } catch {
          return 0;
        }
      });
      
      // Remove oldest entries to stay under quota
      previousKeys.slice(0, previousKeys.length - 5).forEach(key => {
        localStorage.removeItem(key);
      });
    }
    
    // Store new data
    localStorage.setItem(storageKey, JSON.stringify({
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
 * Group locations by grid cells for more efficient processing
 */
function groupLocationsByGrid(locations: SharedAstroSpot[], cellSize: number): SharedAstroSpot[][] {
  const gridCells = new Map<string, SharedAstroSpot[]>();
  
  locations.forEach(loc => {
    if (!loc.latitude || !loc.longitude) return;
    
    // Calculate grid cell coordinates
    const cellX = Math.floor(loc.latitude / cellSize);
    const cellY = Math.floor(loc.longitude / cellSize);
    const cellKey = `${cellX},${cellY}`;
    
    // Add location to its cell
    if (!gridCells.has(cellKey)) {
      gridCells.set(cellKey, []);
    }
    
    gridCells.get(cellKey)!.push(loc);
  });
  
  return Array.from(gridCells.values());
}

/**
 * Get appropriate cache duration based on location characteristics
 */
function getCacheDuration(userLocation: { latitude: number; longitude: number }): number {
  // Check if location is in a stable region (remote areas, low population density)
  const isRemoteRegion = isInRemoteRegion(userLocation.latitude, userLocation.longitude);
  
  // Check time of day - night time data stays valid longer
  const isNightTime = isCurrentlyNightTime();
  
  if (isRemoteRegion && isNightTime) {
    return CACHE_DURATION.highQuality;
  } else if (isRemoteRegion || isNightTime) {
    return CACHE_DURATION.stable;
  }
  
  return CACHE_DURATION.default;
}

/**
 * Check if location is in a remote region with stable conditions
 */
function isInRemoteRegion(latitude: number, longitude: number): boolean {
  // Simple check for remote regions (deserts, polar regions, oceans, etc.)
  return (
    // Antarctic and surrounding regions
    (latitude < -60) ||
    // Arctic and surrounding regions
    (latitude > 60) ||
    // Central Australia
    (latitude < -20 && latitude > -30 && longitude > 120 && longitude < 140) ||
    // Central Asia
    (latitude > 40 && latitude < 50 && longitude > 80 && longitude < 100) ||
    // Western China mountains
    (latitude > 30 && latitude < 40 && longitude > 90 && longitude < 105) ||
    // Sahara Desert
    (latitude > 20 && latitude < 30 && longitude > 10 && longitude < 25)
  );
}

/**
 * Check if it's currently night time (when data tends to be more stable)
 */
function isCurrentlyNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 21 || hour <= 5;
}

/**
 * Simple device performance detection for optimization
 */
function estimateDevicePerformance(): 'high' | 'medium' | 'low' {
  try {
    // Check for memory constraints
    const memory = (navigator as any).deviceMemory;
    if (memory && memory <= 2) return 'low';
    if (memory && memory >= 8) return 'high';
    
    // Check for hardware concurrency
    const cores = navigator.hardwareConcurrency;
    if (cores && cores >= 8) return 'high';
    if (cores && cores >= 4) return 'medium';
    if (cores && cores <= 2) return 'low';
    
    // Default to medium
    return 'medium';
  } catch (_) {
    return 'medium'; // Safe default
  }
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
          if (Date.now() - parsed.timestamp < CACHE_DURATION.default) {
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
