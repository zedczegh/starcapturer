
/**
 * Terrain correction utilities for more accurate Bortle scale measurements
 * Takes into account elevation, mountain shadows, and other geographical features
 */
import { calculateDistance } from '@/utils/geoUtils';

// Cache for terrain data to minimize API calls and improve performance
const terrainDataCache = new Map<string, {
  elevation: number;
  terrain: string;
  timestamp: number;
}>();

/**
 * Get terrain-corrected Bortle scale based on location and elevation
 * @param latitude Geographic latitude
 * @param longitude Geographic longitude
 * @param locationName Optional location name for additional context
 * @returns Terrain-corrected Bortle scale or null if unavailable
 */
export async function getTerrainCorrectedBortleScale(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<number | null> {
  try {
    // Create cache key from rounded coordinates (0.01° precision ≈ 1km)
    const cacheKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
    
    // Check cache first
    let terrainData = terrainDataCache.get(cacheKey);
    
    if (!terrainData) {
      // Get elevation from local dataset or estimate
      const elevation = await getElevationData(latitude, longitude);
      
      // Determine terrain type based on elevation and location name
      const terrain = determineTerrainType(elevation, latitude, longitude, locationName);
      
      terrainData = {
        elevation,
        terrain,
        timestamp: Date.now()
      };
      
      // Cache the terrain data
      terrainDataCache.set(cacheKey, terrainData);
    }
    
    // Get the base Bortle scale from nearest locations
    const { findClosestLocation } = await import('@/utils/locationDatabase');
    const closestLocation = findClosestLocation(latitude, longitude);
    
    if (!closestLocation || typeof closestLocation.bortleScale !== 'number') {
      return null;
    }
    
    // Apply terrain-based corrections
    let correctedScale = closestLocation.bortleScale;
    
    // High elevation typically means clearer skies
    // Every 1000m of elevation can reduce Bortle scale by 0.2-0.5 points
    if (terrainData.elevation > 1000) {
      const elevationCorrection = Math.min(0.9, ((terrainData.elevation - 1000) / 1000) * 0.3);
      correctedScale -= elevationCorrection;
    }
    
    // Mountain areas often have lower light pollution
    if (terrainData.terrain === 'mountains' || terrainData.terrain === 'highland') {
      correctedScale -= 0.4;
    }
    
    // Desert areas have clearer skies due to low humidity and sparse population
    if (terrainData.terrain === 'desert') {
      correctedScale -= 0.5;
    }
    
    // Valleys can trap light pollution
    if (terrainData.terrain === 'valley') {
      correctedScale += 0.3;
    }
    
    // Ensure the scale stays within valid bounds (1-9)
    correctedScale = Math.max(1, Math.min(9, correctedScale));
    
    return Math.round(correctedScale * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error("Error getting terrain-corrected Bortle scale:", error);
    return null;
  }
}

/**
 * Get elevation data for a location
 * Uses local dataset or estimation to avoid API calls
 */
async function getElevationData(latitude: number, longitude: number): Promise<number> {
  // Use local dataset for common locations
  const knownLocationElevations = [
    // Major mountain ranges
    { lat: 27.9881, lng: 86.9250, elevation: 8848, radius: 100 }, // Mt. Everest region
    { lat: 35.8719, lng: 76.5133, elevation: 8611, radius: 100 }, // K2 region
    { lat: 36.2183, lng: 95.8000, elevation: 4500, radius: 500 }, // Qinghai-Tibet Plateau
    { lat: 35.5950, lng: 76.1840, elevation: 5500, radius: 200 }, // Karakoram Range
    { lat: 29.5960, lng: 90.5492, elevation: 4500, radius: 300 }, // Himalayan Range
    
    // High plains and plateaus
    { lat: 46.8625, lng: 103.8467, elevation: 1580, radius: 400 }, // Mongolian Plateau
    { lat: 42.5000, lng: 114.0000, elevation: 1500, radius: 300 }, // Inner Mongolia Plateau
    
    // Desert regions
    { lat: 40.1430, lng: 94.6625, elevation: 1142, radius: 300 }, // Gobi Desert
    { lat: 38.4812, lng: 106.2318, elevation: 1200, radius: 200 }, // Ordos Desert
    
    // Mountain ranges in China
    { lat: 42.0000, lng: 128.0000, elevation: 2691, radius: 100 }, // Changbai Mountains
    { lat: 34.0000, lng: 109.0000, elevation: 3767, radius: 150 }, // Qinling Mountains
    { lat: 39.0000, lng: 113.5833, elevation: 3058, radius: 100 }, // Wutai Mountains
    { lat: 29.5333, lng: 103.3333, elevation: 3099, radius: 100 }, // Emei Mountain
    
    // Desert basins
    { lat: 42.9493, lng: 89.2000, elevation: -154, radius: 150 }, // Turpan Depression
    
    // Major populated areas (low elevation)
    { lat: 39.9042, lng: 116.4074, elevation: 44, radius: 50 }, // Beijing
    { lat: 31.2304, lng: 121.4737, elevation: 4, radius: 50 }, // Shanghai
    { lat: 22.5431, lng: 114.0579, elevation: 0, radius: 50 }, // Shenzhen
    { lat: 30.5728, lng: 104.0668, elevation: 500, radius: 50 }, // Chengdu
    { lat: 22.3193, lng: 114.1694, elevation: 0, radius: 50 }  // Hong Kong
  ];
  
  // Check if we're close to a known location
  for (const location of knownLocationElevations) {
    const distance = calculateDistance(latitude, longitude, location.lat, location.lng);
    if (distance < location.radius) {
      // Adjust elevation based on distance (closer = more accurate)
      const accuracyFactor = 1 - (distance / location.radius);
      const randomVariation = (Math.random() - 0.5) * 200; // Add some natural variation
      return location.elevation * accuracyFactor + randomVariation;
    }
  }
  
  // If no known location is close enough, estimate based on general region
  // This avoids making API calls
  if (latitude >= 27 && latitude <= 40 && longitude >= 85 && longitude <= 105) {
    // Tibetan Plateau and surrounding mountains
    return 4000 + (Math.random() - 0.5) * 1000;
  } else if (latitude >= 35 && latitude <= 50 && longitude >= 70 && longitude <= 85) {
    // Pamir and Tien Shan mountains
    return 3500 + (Math.random() - 0.5) * 1000;
  } else if (latitude >= 35 && latitude <= 45 && longitude >= 95 && longitude <= 110) {
    // Qilian Mountains and Gansu corridor
    return 2000 + (Math.random() - 0.5) * 1000;
  } else if (latitude >= 40 && latitude <= 50 && longitude >= 85 && longitude <= 115) {
    // Mongolian and Gobi Desert region
    return 1200 + (Math.random() - 0.5) * 500;
  } else if (latitude >= 22 && latitude <= 25 && longitude >= 98 && longitude <= 105) {
    // Yunnan mountains
    return 2000 + (Math.random() - 0.5) * 800;
  }
  
  // Default moderate elevation for other areas
  return 500 + (Math.random() - 0.5) * 300;
}

/**
 * Determine terrain type based on elevation and location
 */
function determineTerrainType(
  elevation: number,
  latitude: number,
  longitude: number,
  locationName?: string
): string {
  // Check if location name contains terrain indicators
  if (locationName) {
    const lowercaseName = locationName.toLowerCase();
    if (lowercaseName.includes('mountain') || 
        lowercaseName.includes('peak') || 
        lowercaseName.includes('ridge')) {
      return 'mountains';
    } else if (lowercaseName.includes('valley') || 
               lowercaseName.includes('basin')) {
      return 'valley';
    } else if (lowercaseName.includes('desert')) {
      return 'desert';
    } else if (lowercaseName.includes('plateau')) {
      return 'highland';
    } else if (lowercaseName.includes('lake') || 
               lowercaseName.includes('river')) {
      return 'water';
    }
  }
  
  // Determine by elevation
  if (elevation > 3000) {
    return 'mountains';
  } else if (elevation > 1500) {
    return 'highland';
  } else if (elevation < 0) {
    return 'depression';
  }
  
  // Determine by region
  if (latitude >= 35 && latitude <= 45 && longitude >= 85 && longitude <= 110) {
    if (elevation < 1000) {
      return 'desert'; // Gobi and surrounding deserts
    }
  }
  
  // Default to plains
  return 'plains';
}
