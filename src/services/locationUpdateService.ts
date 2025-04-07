import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs, batchCalculateSiqs } from "./realTimeSiqsService/index";
import { toast } from "sonner";

// In-memory cache for location coordinates and results
interface LocationCache {
  timestamp: number;
  locations: SharedAstroSpot[];
  nighttimeData?: {
    cloudCover: number;
    timestamp: number;
    locationNames: string[];
  };
}

// Global cache with timeout - reduced from 5 minutes to 2 minutes for more freshness
const locationCache: Record<string, LocationCache> = {};
const CACHE_TIMEOUT = 2 * 60 * 1000; // 2 minutes

/**
 * Generate a cache key based on user location and radius
 */
const generateCacheKey = (
  latitude: number,
  longitude: number,
  radius: number,
  type: 'certified' | 'calculated'
): string => {
  // More precise lat/lng for better cache differentiation
  const lat = latitude.toFixed(3);
  const lng = longitude.toFixed(3);
  return `${type}-${lat}-${lng}-${radius}`;
};

/**
 * Check if cache is valid
 */
const isCacheValid = (cacheKey: string): boolean => {
  const cache = locationCache[cacheKey];
  
  if (!cache) return false;
  
  const now = Date.now();
  return now - cache.timestamp < CACHE_TIMEOUT;
};

/**
 * Check if it's currently nighttime at the location
 */
const isNighttime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 19 || hour <= 6; // 7 PM to 6 AM
};

/**
 * Pre-filter locations based on approximate night conditions before calculating SIQS
 * This improves loading performance significantly
 */
const preFilterLocationsForNightConditions = (
  locations: SharedAstroSpot[], 
  nighttimeCloudCover?: number
): SharedAstroSpot[] => {
  // Filter out locations with Bortle scale > 7 as they're likely too light polluted
  // unless they're certified locations (which should always be included)
  return locations.filter(loc => {
    // Always include certified locations
    if (loc.isDarkSkyReserve || loc.certification) return true;
    
    // If it's nighttime and we have cloud cover data, use it for pre-filtering
    if (isNighttime() && typeof nighttimeCloudCover === 'number') {
      // If nighttime cloud cover is high (>70%), only include locations with lower Bortle scale (better dark sky)
      if (nighttimeCloudCover > 70) {
        return !loc.bortleScale || loc.bortleScale <= 5;
      }
      // If moderate cloud cover (40-70%), include locations with decent dark sky
      else if (nighttimeCloudCover > 40) {
        return !loc.bortleScale || loc.bortleScale <= 6;
      }
    }
    
    // For calculated locations, do quick pre-filtering based on Bortle scale
    return !loc.bortleScale || loc.bortleScale <= 7;
  });
};

/**
 * Efficiently fetch and cache nighttime cloud cover data for a region
 * This optimizes by only checking a couple of main locations rather than every point
 */
const getNighttimeCloudCoverForRegion = async (
  latitude: number,
  longitude: number,
  radius: number
): Promise<number | undefined> => {
  const cacheKey = `nighttime-${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
  
  // Check cache first for nighttime data (valid for 60 minutes)
  if (locationCache[cacheKey]?.nighttimeData) {
    const cachedData = locationCache[cacheKey].nighttimeData;
    if (cachedData && Date.now() - cachedData.timestamp < 60 * 60 * 1000) {
      console.log(`Using cached nighttime cloud cover: ${cachedData.cloudCover}% for region`);
      return cachedData.cloudCover;
    }
  }
  
  try {
    // Import only when needed to keep initial bundle smaller
    const { findNearestTowns } = await import('@/utils/locationUtils');
    const { fetchForecastData } = await import('@/lib/api');
    const { extractNightForecasts, calculateAverageCloudCover } = await import('@/components/forecast/NightForecastUtils');
    
    // Find 2 nearest towns instead of calculating for every point
    const nearbyTowns = await findNearestTowns(latitude, longitude, 2);
    
    if (nearbyTowns && nearbyTowns.length > 0) {
      // Get forecasts for these towns
      const forecasts = await Promise.all(
        nearbyTowns.map(town => 
          fetchForecastData({ 
            latitude: town.latitude, 
            longitude: town.longitude,
            days: 1
          }).catch(() => null)
        )
      );
      
      // Calculate average cloud cover from night forecasts
      const validForecasts = forecasts.filter(f => f !== null);
      if (validForecasts.length === 0) return undefined;
      
      let totalCloudCover = 0;
      let validForecastCount = 0;
      
      for (const forecast of validForecasts) {
        if (!forecast?.hourly) continue;
        
        const nightForecasts = extractNightForecasts(forecast.hourly);
        if (nightForecasts.length === 0) continue;
        
        const avgCloudCover = calculateAverageCloudCover(nightForecasts);
        totalCloudCover += avgCloudCover;
        validForecastCount++;
      }
      
      if (validForecastCount > 0) {
        const avgNighttimeCloudCover = totalCloudCover / validForecastCount;
        console.log(`Average nighttime cloud cover for region: ${avgNighttimeCloudCover.toFixed(1)}%`);
        
        // Store in cache
        if (!locationCache[cacheKey]) {
          locationCache[cacheKey] = { 
            timestamp: Date.now(),
            locations: []
          };
        }
        
        locationCache[cacheKey].nighttimeData = {
          cloudCover: avgNighttimeCloudCover,
          timestamp: Date.now(),
          locationNames: nearbyTowns.map(t => t.name)
        };
        
        return avgNighttimeCloudCover;
      }
    }
  } catch (error) {
    console.error("Error fetching nighttime cloud cover for region:", error);
  }
  
  return undefined;
};

/**
 * Update locations with current SIQS values
 */
export const updateLocationsWithRealTimeSiqs = async (
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number },
  radius: number,
  type: 'certified' | 'calculated'
): Promise<SharedAstroSpot[]> => {
  if (!locations || locations.length === 0 || !userLocation) {
    return locations;
  }
  
  // Check cache first
  const cacheKey = generateCacheKey(
    userLocation.latitude, 
    userLocation.longitude, 
    radius,
    type
  );
  
  if (isCacheValid(cacheKey)) {
    console.log(`Using cached locations for ${type} around ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`);
    return locationCache[cacheKey].locations;
  }
  
  try {
    console.log(`Updating ${locations.length} ${type} locations with real-time SIQS data`);
    
    // For calculated locations, first get nighttime cloud cover for the region to optimize filtering
    let nighttimeCloudCover: number | undefined;
    if (type === 'calculated' && isNighttime()) {
      nighttimeCloudCover = await getNighttimeCloudCoverForRegion(
        userLocation.latitude,
        userLocation.longitude,
        radius
      );
    }
    
    // Pre-filter locations to improve performance (only for calculated locations)
    const locationsToUpdate = type === 'calculated' 
      ? preFilterLocationsForNightConditions(locations, nighttimeCloudCover)
      : locations;
    
    console.log(`After pre-filtering: ${locationsToUpdate.length} locations to update`);
    
    // For certified locations, batch process in parallel for efficiency
    if (type === 'certified' || locationsToUpdate.length > 10) {
      // Use smaller batch size (5) for more consistent processing
      const updatedLocations = await batchCalculateSiqs(locationsToUpdate, 5);
      
      // Save to cache
      locationCache[cacheKey] = {
        timestamp: Date.now(),
        locations: updatedLocations
      };
      
      return updatedLocations;
    } 
    // For calculated locations or small sets, process one by one
    else {
      const updatedLocations = await Promise.all(
        locationsToUpdate.map(async (location) => {
          if (!location.latitude || !location.longitude) return location;
          
          try {
            const result = await calculateRealTimeSiqs(
              location.latitude,
              location.longitude,
              location.bortleScale || 5
            );
            
            return {
              ...location,
              siqs: result.siqs,
              isViable: result.isViable,
              siqsFactors: result.factors
            };
          } catch (error) {
            console.error(`Error calculating SIQS for location ${location.name}:`, error);
            return location;
          }
        })
      );
      
      // Save to cache
      locationCache[cacheKey] = {
        timestamp: Date.now(),
        locations: updatedLocations
      };
      
      return updatedLocations;
    }
  } catch (error) {
    console.error("Error updating locations with real-time SIQS:", error);
    return locations;
  }
};

/**
 * Clear the location cache - called automatically on daily/hourly intervals
 */
export const clearLocationCache = () => {
  const cacheKeys = Object.keys(locationCache);
  const cacheCount = cacheKeys.length;
  
  cacheKeys.forEach(key => {
    delete locationCache[key];
  });
  
  console.log(`Location cache cleared (${cacheCount} entries)`);
};

/**
 * Get the number of locations in cache
 */
export const getLocationCacheCount = (): number => {
  return Object.keys(locationCache).length;
};

/**
 * Check if locations need updating based on user movement
 */
export const shouldUpdateLocations = (
  prevLocation: { latitude: number; longitude: number } | null,
  newLocation: { latitude: number; longitude: number } | null
): boolean => {
  if (!prevLocation || !newLocation) return true;
  
  // Calculate approximate distance
  const latDiff = Math.abs(prevLocation.latitude - newLocation.latitude);
  const lngDiff = Math.abs(prevLocation.longitude - newLocation.longitude);
  
  // If moved more than ~1km, update locations (more sensitive than before)
  // Roughly 0.01 degrees latitude = ~1.1km
  return latDiff > 0.01 || lngDiff > 0.01;
};

/**
 * Force update all location data regardless of cache status
 */
export const forceUpdateAllLocations = async (
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null
): Promise<SharedAstroSpot[]> => {
  if (!locations || locations.length === 0 || !userLocation) {
    return locations;
  }
  
  console.log(`Force updating ${locations.length} locations with fresh SIQS data`);
  
  try {
    // Get nighttime cloud cover for the region to optimize filtering
    let nighttimeCloudCover: number | undefined;
    if (isNighttime()) {
      nighttimeCloudCover = await getNighttimeCloudCoverForRegion(
        userLocation.latitude,
        userLocation.longitude,
        100 // Default radius
      );
    }
    
    // Pre-filter locations to improve performance
    const filteredLocations = preFilterLocationsForNightConditions(locations, nighttimeCloudCover);
    console.log(`After pre-filtering: ${filteredLocations.length} locations to update`);
    
    // Update all locations with fresh data
    const updatedLocations = await batchCalculateSiqs(filteredLocations, 5);
    return updatedLocations;
  } catch (error) {
    console.error("Error force updating locations:", error);
    return locations;
  }
};

// Set up automatic cache clearing
const setupAutoCacheClear = () => {
  // Clear cache every hour to ensure fresh data
  const hourlyCleanup = setInterval(() => {
    clearLocationCache();
  }, 60 * 60 * 1000); // Every hour
  
  // Also clear at midnight
  const setupMidnightCleanup = () => {
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // next day
      0, 0, 0 // midnight
    );
    const msUntilMidnight = night.getTime() - now.getTime();
    
    setTimeout(() => {
      clearLocationCache();
      setupMidnightCleanup(); // Setup for next day
    }, msUntilMidnight);
  };
  
  setupMidnightCleanup();
  
  // Return cleanup function
  return () => {
    clearInterval(hourlyCleanup);
  };
};

// Initialize auto cache clear
setupAutoCacheClear();
