/**
 * Utilities for weather-related calculations and data processing
 */
import { calculateDistance } from './geoUtils';

// Cache for minimizing API calls
interface CloudCoverCache {
  [key: string]: {
    cloudCover: number;
    timestamp: number;
  }
}

const cloudCoverCache: CloudCoverCache = {};
const CACHE_TIMEOUT = 60 * 60 * 1000; // 1 hour cache

/**
 * Get nighttime cloud cover for a location
 * Cached to minimize API calls
 */
export const getNighttimeCloudCover = async (
  latitude: number, 
  longitude: number
): Promise<number> => {
  // Create cache key with lower precision to group nearby locations
  const cacheKey = `${latitude.toFixed(1)},${longitude.toFixed(1)}`;
  
  // Check cache first
  if (cloudCoverCache[cacheKey] && 
      (Date.now() - cloudCoverCache[cacheKey].timestamp) < CACHE_TIMEOUT) {
    return cloudCoverCache[cacheKey].cloudCover;
  }
  
  try {
    const { fetchForecastData } = await import('@/lib/api');
    
    const forecast = await fetchForecastData({ 
      latitude,
      longitude,
      days: 1
    });
    
    if (!forecast?.hourly || !forecast.hourly.time) {
      throw new Error('Invalid forecast data');
    }
    
    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    
    // For nighttime (7 PM - 6 AM), use current and future hours
    // For daytime, use the coming night
    let cloudCoverSum = 0;
    let hourCount = 0;
    const isNighttime = currentHour >= 19 || currentHour <= 6;
    
    if (isNighttime) {
      // Use current and next few hours if it's already night
      const startIdx = forecast.hourly.time.findIndex(time => 
        new Date(time).getHours() === currentHour
      );
      
      if (startIdx >= 0) {
        // Get 5 hours of data or until daytime
        for (let i = 0; i < 5; i++) {
          const idx = startIdx + i;
          if (idx >= forecast.hourly.time.length) break;
          
          const hourTime = new Date(forecast.hourly.time[idx]);
          const hour = hourTime.getHours();
          
          // Stop if we reach daytime
          if (hour > 6 && hour < 19) break;
          
          if (forecast.hourly.cloud_cover && forecast.hourly.cloud_cover[idx] !== undefined) {
            cloudCoverSum += forecast.hourly.cloud_cover[idx];
            hourCount++;
          }
        }
      }
    } else {
      // Use tonight's forecast
      for (let i = 0; i < forecast.hourly.time.length; i++) {
        const hourTime = new Date(forecast.hourly.time[i]);
        const hour = hourTime.getHours();
        
        // Only include nighttime hours for today/tonight
        if ((hour >= 19 || hour <= 6) && 
            hourTime.getDate() === now.getDate() || 
            (hourTime.getDate() === now.getDate() + 1 && hour <= 6)) {
          
          if (forecast.hourly.cloud_cover && forecast.hourly.cloud_cover[i] !== undefined) {
            cloudCoverSum += forecast.hourly.cloud_cover[i];
            hourCount++;
          }
        }
      }
    }
    
    if (hourCount === 0) {
      // Fallback - use average of all hours if we couldn't find appropriate night hours
      hourCount = forecast.hourly.cloud_cover?.length || 0;
      cloudCoverSum = forecast.hourly.cloud_cover?.reduce((sum, cc) => sum + cc, 0) || 0;
    }
    
    const avgCloudCover = hourCount > 0 ? cloudCoverSum / hourCount : 50; // Default to 50% if no data
    
    // Cache the result
    cloudCoverCache[cacheKey] = {
      cloudCover: avgCloudCover,
      timestamp: Date.now()
    };
    
    return avgCloudCover;
  } catch (error) {
    console.error('Error fetching nighttime cloud cover:', error);
    return 50; // Default to 50% cloud cover on error
  }
};

/**
 * Find a location within the radius that's likely to have 
 * lower light pollution based on terrain and distance from cities
 */
export const findLowerLightPollutionLocation = (
  latitude: number, 
  longitude: number,
  radius: number,
  bortleScale?: number
): { latitude: number; longitude: number } => {
  // If we already have an excellent location (Bortle scale <= 3), keep it
  if (bortleScale !== undefined && bortleScale <= 3) {
    return { latitude, longitude };
  }
  
  // Generate a direction away from nearest city if possible
  try {
    const { findNearestTowns } = require('../utils/locationUtils');
    const nearbyTowns = findNearestTowns(latitude, longitude, 1);
    
    if (nearbyTowns && nearbyTowns.length > 0) {
      const nearestTown = nearbyTowns[0];
      
      // Calculate direction away from the town
      const bearingRad = Math.atan2(
        longitude - nearestTown.longitude,
        latitude - nearestTown.latitude
      );
      
      // Move in the opposite direction (away from town)
      // Use a distance that's 50-70% of the radius
      const distanceFactor = 0.5 + (Math.random() * 0.2); 
      const moveDistance = radius * distanceFactor;
      
      // Calculate new position (using simplified formula for small distances)
      const latOffset = moveDistance * Math.cos(bearingRad) / 111.32;
      const lngOffset = moveDistance * Math.sin(bearingRad) / 
        (111.32 * Math.cos(latitude * Math.PI / 180));
      
      return {
        latitude: latitude + latOffset,
        longitude: longitude + lngOffset
      };
    }
  } catch (error) {
    console.warn("Error finding lower light pollution location:", error);
  }
  
  // Fallback: Move in a random direction
  const angle = Math.random() * 2 * Math.PI;
  const distance = (0.5 + Math.random() * 0.3) * radius;
  
  // Convert to approximate lat/lng change
  const latChange = (distance / 111.32) * Math.cos(angle);
  const lngChange = (distance / (111.32 * Math.cos(latitude * Math.PI / 180))) * Math.sin(angle);
  
  return {
    latitude: latitude + latChange,
    longitude: longitude + lngChange
  };
};

/**
 * Check if a location is a good candidate based on cloud cover and parameters
 */
export const isGoodViewingCandidate = (
  cloudCover: number | undefined,
  bortleScale: number | undefined,
  siqs: number | undefined
): boolean => {
  // Consider location good if:
  // - Cloud cover is below 60% or undefined
  // - Bortle scale is 5 or less (or undefined)
  // - SIQS is 5 or higher (or undefined)
  return (
    (cloudCover === undefined || cloudCover < 60) &&
    (bortleScale === undefined || bortleScale <= 5) &&
    (siqs === undefined || siqs >= 5)
  );
};

/**
 * Clear the cloud cover cache - called when force refreshing data
 */
export const clearCloudCoverCache = (): void => {
  Object.keys(cloudCoverCache).forEach(key => {
    delete cloudCoverCache[key];
  });
  console.log("Cloud cover cache cleared");
};

export default {
  getNighttimeCloudCover,
  findLowerLightPollutionLocation,
  isGoodViewingCandidate,
  clearCloudCoverCache
};
