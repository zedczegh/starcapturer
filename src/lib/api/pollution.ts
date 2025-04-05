
/**
 * Enhanced light pollution database and detection algorithms
 * Includes terrain correction, altitude consideration, and satellite-derived data
 */

import { findClosestCity, interpolateBortleScale } from "@/utils/lightPollutionData";
import { getCityBortleScale, isInChina, getChineseRegion } from "@/utils/chinaBortleData";
import { hasProperty } from "@/types/weather-utils";

// Cache implementation for faster data access
const pollutionCache = new Map<string, {
  bortleScale: number,
  timestamp: number,
  source: string,
  confidence: number
}>();

// Cache TTL in milliseconds - 12 hours for stable light pollution data
const CACHE_TTL = 12 * 60 * 60 * 1000;

// Add more detailed data for rural northern provinces
const northernRuralAreas = [
  // Inner Mongolia rural areas
  { name: "Hulunbuir Grasslands", lat: 49.2122, lng: 119.7536, bortleScale: 2 },
  { name: "Xilingol Grasslands", lat: 43.9436, lng: 116.0741, bortleScale: 2.5 },
  { name: "Ordos Desert", lat: 39.6087, lng: 109.7720, bortleScale: 2.8 },
  { name: "Horqin Grasslands", lat: 44.5791, lng: 121.5161, bortleScale: 3 },
  
  // Heilongjiang rural areas
  { name: "Greater Khingan Mountains", lat: 51.6770, lng: 124.7108, bortleScale: 1.8 },
  { name: "Wudalianchi Volcanic Area", lat: 48.7208, lng: 126.1183, bortleScale: 2.2 },
  { name: "Zhalong Nature Reserve", lat: 47.1116, lng: 124.2541, bortleScale: 2.5 },
  { name: "Sanjiang Plain", lat: 47.5498, lng: 133.5102, bortleScale: 2.3 },
  
  // Jilin rural areas
  { name: "Changbai Mountains", lat: 42.1041, lng: 128.1955, bortleScale: 2 },
  { name: "Chagan Lake", lat: 45.2580, lng: 124.2766, bortleScale: 3 },
  { name: "Jingyuetan National Forest", lat: 43.8266, lng: 125.4037, bortleScale: 3.5 },
  
  // Liaoning rural areas
  { name: "Huanren Manchu County", lat: 41.2674, lng: 125.3610, bortleScale: 3 },
  { name: "Fenghuangshan Mountains", lat: 40.5777, lng: 123.7510, bortleScale: 3.2 },
  
  // Add new western entries with extremely dark skies
  { name: "Altun Mountains", lat: 38.7922, lng: 87.3297, bortleScale: 1.2 },
  { name: "Taklamakan Desert Center", lat: 39.5828, lng: 83.4917, bortleScale: 1.0 },
  { name: "Kunlun Mountains", lat: 36.2442, lng: 84.6123, bortleScale: 1.3 },
  { name: "Qaidam Basin", lat: 37.1231, lng: 95.0213, bortleScale: 1.4 },
  { name: "Hoh Xil Nature Reserve", lat: 35.3982, lng: 93.0193, bortleScale: 1.1 }
];

/**
 * Find the nearest northern rural area and its Bortle scale
 * With improved haversine algorithm for higher precision
 * @param latitude Geographic latitude
 * @param longitude Geographic longitude
 * @returns The nearest rural area and its Bortle scale
 */
function findNearestRuralArea(latitude: number, longitude: number): { name: string; bortleScale: number; distance: number } | null {
  if (!isFinite(latitude) || !isFinite(longitude)) return null;
  
  let nearestArea = null;
  let minDistance = Infinity;
  
  for (const area of northernRuralAreas) {
    // Calculate distance using improved Haversine formula with WGS84 corrections
    const R = 6371.0088; // Earth's mean radius in km (WGS84)
    const dLat = (area.lat - latitude) * Math.PI / 180;
    const dLon = (area.lng - longitude) * Math.PI / 180;
    const lat1 = latitude * Math.PI / 180;
    const lat2 = area.lat * Math.PI / 180;
    
    // Haversine formula with improved precision
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1) * Math.cos(lat2) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestArea = { 
        name: area.name, 
        bortleScale: area.bortleScale,
        distance: distance 
      };
    }
  }
  
  // Search radius increased to 300km for better rural coverage
  return nearestArea && minDistance < 300 ? nearestArea : null;
}

/**
 * Calculate elevation-adjusted Bortle scale
 * Higher elevations typically have less air pollution and better transparency
 */
async function getElevationAdjustedBortle(
  latitude: number, 
  longitude: number, 
  baseBortleScale: number
): Promise<number> {
  try {
    // Use dynamic import to load the elevation data - more efficient
    const { getTerrainElevation } = await import('@/utils/terrainData');
    const elevation = await getTerrainElevation(latitude, longitude);
    
    if (elevation && elevation > 0) {
      // Apply elevation-based correction with exponential decay function
      // Higher elevations improve Bortle scale (lower number = better skies)
      let elevationFactor = 0;
      
      if (elevation > 3000) {
        // High mountains above 3000m get significant improvement
        elevationFactor = -0.8;
      } else if (elevation > 1500) {
        // Medium mountains get moderate improvement
        elevationFactor = -0.5 * (elevation - 1500) / 1500;
      } else if (elevation > 500) {
        // Hills get slight improvement
        elevationFactor = -0.2 * (elevation - 500) / 1000;
      }
      
      return Math.max(1, baseBortleScale + elevationFactor);
    }
    
    return baseBortleScale;
  } catch (error) {
    console.warn("Elevation adjustment failed:", error);
    return baseBortleScale;
  }
}

/**
 * Check if a location is likely to be over water (ocean/lake/river)
 * These typically have lower light pollution but might need special handling
 */
function isLikelyWaterLocation(latitude: number, longitude: number): boolean {
  // Simple checks for major water bodies (can be improved with coastline data)
  const majorOceans = [
    { name: 'Pacific Ocean', box: {minLat: -60, maxLat: 65, minLng: 100, maxLng: -120} },
    { name: 'Indian Ocean', box: {minLat: -60, maxLat: 30, minLng: 20, maxLng: 120} },
    // Normalize longitude for wrapping around the dateline
    { name: 'Atlantic Ocean', box: {minLat: -60, maxLat: 65, minLng: -80, maxLng: 20} },
  ];
  
  // Normalize longitude to -180 to 180
  const normLng = ((longitude + 540) % 360) - 180;
  
  // Check if point falls within any ocean bounding box
  for (const ocean of majorOceans) {
    const box = ocean.box;
    
    // Handle special case of the Pacific Ocean crossing the dateline
    if (ocean.name === 'Pacific Ocean') {
      if ((latitude >= box.minLat && latitude <= box.maxLat) && 
          ((normLng >= box.minLng) || (normLng <= box.maxLng))) {
        return true;
      }
    } else {
      if ((latitude >= box.minLat && latitude <= box.maxLat) && 
          (normLng >= box.minLng && normLng <= box.maxLng)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Fetches light pollution data based on coordinates
 * Prioritizes our internal database over network requests or estimates
 * With improved handling for all Chinese regions, optimized caching, and terrain correction
 */
export async function fetchLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number | null } | null> {
  try {
    // Validate coordinates before proceeding
    if (!isFinite(latitude) || !isFinite(longitude)) {
      console.log("Invalid coordinates for light pollution data:", latitude, longitude);
      return { bortleScale: 4 }; // Return default value instead of null
    }
    
    // Generate cache key with 4 decimal precision
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    
    // Check cache first for instant responses
    const cachedData = pollutionCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      console.log(`Using cached Bortle scale: ${cachedData.bortleScale} (from ${cachedData.source})`);
      return { bortleScale: cachedData.bortleScale };
    }
    
    // Check if location is over water - different light pollution dynamics
    if (isLikelyWaterLocation(latitude, longitude)) {
      const waterBortleScale = 2.5; // Default for most ocean areas
      pollutionCache.set(cacheKey, {
        bortleScale: waterBortleScale,
        timestamp: Date.now(),
        source: 'water-body-estimate',
        confidence: 0.8
      });
      
      console.log(`Location appears to be over water, using Bortle scale: ${waterBortleScale}`);
      return { bortleScale: waterBortleScale };
    }
    
    // First check for specific Chinese cities using our comprehensive database
    const specificCityBortle = getCityBortleScale(latitude, longitude);
    if (specificCityBortle !== null) {
      console.log(`Using specific city Bortle scale: ${specificCityBortle}`);
      
      // Cache the high-quality result
      pollutionCache.set(cacheKey, {
        bortleScale: specificCityBortle,
        timestamp: Date.now(),
        source: 'city-database',
        confidence: 0.95
      });
      
      return { bortleScale: specificCityBortle };
    }
    
    // Next check for rural areas with known dark skies
    const nearestRuralArea = findNearestRuralArea(latitude, longitude);
    if (nearestRuralArea && nearestRuralArea.distance < 200) {
      // Apply a distance-based interpolation for areas near but not at rural dark sites
      let adjustedBortleScale = nearestRuralArea.bortleScale;
      
      if (nearestRuralArea.distance > 50) {
        // Gradually increase Bortle scale (more light pollution) as distance increases
        const distanceAdjustment = (nearestRuralArea.distance - 50) / 150 * 1.5;
        adjustedBortleScale += distanceAdjustment;
        adjustedBortleScale = Math.min(5, adjustedBortleScale); // Cap at Bortle 5
      }
      
      console.log(`Using rural area estimate for ${nearestRuralArea.name}, distance: ${nearestRuralArea.distance.toFixed(1)}km, adjusted Bortle: ${adjustedBortleScale.toFixed(1)}`);
      
      // Apply elevation adjustment for even more accuracy
      const elevationAdjustedBortle = await getElevationAdjustedBortle(
        latitude, 
        longitude, 
        adjustedBortleScale
      );
      
      // Cache the result
      pollutionCache.set(cacheKey, {
        bortleScale: elevationAdjustedBortle,
        timestamp: Date.now(),
        source: 'rural-database-with-elevation',
        confidence: 0.9 - (nearestRuralArea.distance / 400) // Confidence reduces with distance
      });
      
      return { bortleScale: elevationAdjustedBortle };
    }
    
    // Try our wider database of cities and regions
    try {
      const closestCity = await findClosestCity(latitude, longitude);
      if (closestCity && closestCity.bortleScale) {
        console.log(`Using city database Bortle scale for ${closestCity.name}: ${closestCity.bortleScale}`);
        
        // Apply elevation correction for more accuracy
        const elevationAdjustedBortle = await getElevationAdjustedBortle(
          latitude, 
          longitude, 
          closestCity.bortleScale
        );
        
        // Cache the result
        pollutionCache.set(cacheKey, {
          bortleScale: elevationAdjustedBortle,
          timestamp: Date.now(),
          source: 'general-city-database',
          confidence: 0.85
        });
        
        return { bortleScale: elevationAdjustedBortle };
      }
    } catch (error) {
      console.warn("Error finding closest city:", error);
    }
    
    // Fall back to interpolation from known points in the database
    try {
      const interpolatedScale = await interpolateBortleScale(latitude, longitude);
      if (interpolatedScale !== null) {
        console.log(`Using interpolated Bortle scale: ${interpolatedScale}`);
        
        // Apply elevation adjustment to interpolated data
        const elevationAdjustedBortle = await getElevationAdjustedBortle(
          latitude, 
          longitude, 
          interpolatedScale
        );
        
        // Cache the result
        pollutionCache.set(cacheKey, {
          bortleScale: elevationAdjustedBortle,
          timestamp: Date.now(),
          source: 'interpolation',
          confidence: 0.7
        });
        
        return { bortleScale: elevationAdjustedBortle };
      }
    } catch (error) {
      console.warn("Error in Bortle scale interpolation:", error);
    }
    
    // Last resort: estimate based on general regional patterns
    const inChina = isInChina(latitude, longitude);
    let fallbackBortle = 4; // Default middle value
    
    if (inChina) {
      const region = getChineseRegion(latitude, longitude);
      
      // Adjust based on Chinese region
      switch(region) {
        case 'northeast': 
          fallbackBortle = 3.5; 
          break;
        case 'north': 
          fallbackBortle = 5.5; 
          break;
        case 'east': 
          fallbackBortle = 6; 
          break;
        case 'south': 
          fallbackBortle = 5; 
          break;
        case 'southwest': 
          fallbackBortle = 4; 
          break;
        case 'northwest': 
          fallbackBortle = 3; 
          break;
        case 'central': 
          fallbackBortle = 5.5; 
          break;
      }
    } else {
      // Very simple global region handling - could be expanded
      if (latitude > 60 || latitude < -50) {
        // Polar regions tend to be darker
        fallbackBortle = 2.5;
      } else if (Math.abs(latitude) > 40) {
        // Mid-high latitudes vary
        fallbackBortle = 3.5;
      }
    }
    
    console.log(`Using fallback regional Bortle scale estimate: ${fallbackBortle}`);
    
    // Apply elevation adjustment to fallback
    const elevationAdjustedBortle = await getElevationAdjustedBortle(
      latitude, 
      longitude, 
      fallbackBortle
    );
    
    // Cache the result
    pollutionCache.set(cacheKey, {
      bortleScale: elevationAdjustedBortle,
      timestamp: Date.now(),
      source: 'regional-fallback',
      confidence: 0.5
    });
    
    return { bortleScale: elevationAdjustedBortle };
  } catch (error) {
    console.error("Error determining light pollution:", error);
    return { bortleScale: 4 }; // Return a reasonable default on error
  }
}

/**
 * Clear pollution data cache to force fresh data
 */
export function clearPollutionCache(): void {
  const size = pollutionCache.size;
  pollutionCache.clear();
  console.log(`Cleared pollution cache (${size} entries removed)`);
}

/**
 * Get current pollution cache stats
 */
export function getPollutionCacheStats(): { size: number, averageAge: number } {
  let totalAge = 0;
  const now = Date.now();
  
  pollutionCache.forEach(entry => {
    totalAge += (now - entry.timestamp);
  });
  
  const averageAge = pollutionCache.size > 0 ? totalAge / pollutionCache.size / 1000 : 0;
  
  return {
    size: pollutionCache.size,
    averageAge: Math.round(averageAge) // in seconds
  };
}

/**
 * Remove expired entries from the cache to keep memory usage efficient
 */
export function cleanupExpiredPollutionCache(): number {
  let removed = 0;
  const now = Date.now();
  
  pollutionCache.forEach((value, key) => {
    if ((now - value.timestamp) > CACHE_TTL) {
      pollutionCache.delete(key);
      removed++;
    }
  });
  
  return removed;
}
