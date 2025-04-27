
/**
 * High-performance star analysis utilities for more accurate Bortle scale measurements
 */
import { countStarsInImage, calculateBortleFromStars } from './starCountUtils';

// Cache to store recent star count measurements
const starCountCache = new Map<string, {
  bortleScale: number;
  timestamp: number;
  confidence: 'high' | 'medium' | 'low';
}>();

/**
 * Get Bortle scale based on star counts for a given location
 * Uses both cached and real-time measurements
 * 
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Calculated Bortle scale or null if not available
 */
export async function getStarCountBortleScale(
  latitude: number, 
  longitude: number
): Promise<number | null> {
  // Create cache key from rounded coordinates (0.01° precision ≈ 1km)
  const cacheKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
  
  // Check cache first (valid for 7 days)
  const cachedData = starCountCache.get(cacheKey);
  const cacheAgeLimit = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  
  if (cachedData && (Date.now() - cachedData.timestamp) < cacheAgeLimit) {
    console.log(`Using cached star count Bortle scale: ${cachedData.bortleScale} (confidence: ${cachedData.confidence})`);
    return cachedData.bortleScale;
  }
  
  try {
    // Check if we have any star measurements in local storage
    const measurements = await getLocalStarMeasurements();
    
    // Find measurements close to this location
    const nearbyMeasurements = measurements.filter(m => {
      // Calculate distance (simplified using ~111km per degree)
      const latDiff = Math.abs(m.latitude - latitude);
      const lngDiff = Math.abs(m.longitude - longitude);
      const distanceInDegrees = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      // Consider measurements within ~10km (approximately 0.09 degrees)
      return distanceInDegrees < 0.09;
    });
    
    if (nearbyMeasurements.length > 0) {
      // Sort by distance (closest first)
      nearbyMeasurements.sort((a, b) => {
        const distA = Math.sqrt(
          Math.pow(a.latitude - latitude, 2) + 
          Math.pow(a.longitude - longitude, 2)
        );
        const distB = Math.sqrt(
          Math.pow(b.latitude - latitude, 2) + 
          Math.pow(b.longitude - longitude, 2)
        );
        return distA - distB;
      });
      
      // Use the closest measurement
      const closestMeasurement = nearbyMeasurements[0];
      console.log(`Found nearby star measurement at ${closestMeasurement.latitude}, ${closestMeasurement.longitude} with Bortle ${closestMeasurement.bortleScale}`);
      
      // Calculate confidence based on measurement age and distance
      const ageInDays = (Date.now() - new Date(closestMeasurement.timestamp).getTime()) / (24 * 60 * 60 * 1000);
      const distInDegrees = Math.sqrt(
        Math.pow(closestMeasurement.latitude - latitude, 2) + 
        Math.pow(closestMeasurement.longitude - longitude, 2)
      );
      
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      
      // High confidence: recent and very close
      if (ageInDays < 30 && distInDegrees < 0.02) {
        confidence = 'high';
      } 
      // Low confidence: old or far
      else if (ageInDays > 180 || distInDegrees > 0.05) {
        confidence = 'low';
      }
      
      // Cache the result
      starCountCache.set(cacheKey, {
        bortleScale: closestMeasurement.bortleScale,
        timestamp: Date.now(),
        confidence
      });
      
      return closestMeasurement.bortleScale;
    }
  } catch (error) {
    console.error("Error getting star count Bortle scale:", error);
  }
  
  // No measurements available
  return null;
}

/**
 * Get all star measurements from local storage
 */
async function getLocalStarMeasurements(): Promise<{
  latitude: number;
  longitude: number;
  bortleScale: number;
  starCount: number | null;
  timestamp: string;
}[]> {
  try {
    const measurementsString = localStorage.getItem('star_measurements');
    if (measurementsString) {
      return JSON.parse(measurementsString);
    }
  } catch (error) {
    console.error("Error reading star measurements:", error);
  }
  
  return [];
}

/**
 * Process star measurement from camera image
 * @param imageData Camera image data
 * @param latitude Current latitude
 * @param longitude Current longitude
 * @returns Calculated Bortle scale and star count
 */
export async function processStarMeasurement(
  imageData: ImageData,
  latitude: number,
  longitude: number
): Promise<{ bortleScale: number, starCount: number }> {
  // Count stars in image
  const starCount = countStarsInImage(imageData);
  
  // Calculate average sky brightness (excluding bright spots)
  let totalBrightness = 0;
  let pixelCount = 0;
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    const brightness = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
    
    // Only include darker pixels in average (exclude stars and bright objects)
    if (brightness < 180) {
      totalBrightness += brightness;
      pixelCount++;
    }
  }
  
  const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 128;
  
  // Calculate Bortle scale from stars and brightness
  const bortleScale = calculateBortleFromStars(starCount, avgBrightness);
  
  // Save measurement to local storage
  saveStarMeasurement(latitude, longitude, bortleScale, starCount);
  
  // Also cache the result
  const cacheKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
  starCountCache.set(cacheKey, {
    bortleScale,
    timestamp: Date.now(),
    confidence: 'high' // Direct measurement has high confidence
  });
  
  return { bortleScale, starCount };
}

/**
 * Save star measurement to local storage
 */
function saveStarMeasurement(
  latitude: number,
  longitude: number,
  bortleScale: number,
  starCount: number
): void {
  try {
    // Get existing measurements
    const measurementsString = localStorage.getItem('star_measurements');
    const measurements = measurementsString ? JSON.parse(measurementsString) : [];
    
    // Add new measurement
    measurements.push({
      latitude,
      longitude,
      bortleScale,
      starCount,
      timestamp: new Date().toISOString(),
      method: 'camera'
    });
    
    // Limit to most recent 100 measurements
    if (measurements.length > 100) {
      measurements.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      measurements.splice(100);
    }
    
    // Save back to local storage
    localStorage.setItem('star_measurements', JSON.stringify(measurements));
    
    console.log(`Saved star measurement: ${starCount} stars, Bortle ${bortleScale}`);
  } catch (error) {
    console.error("Error saving star measurement:", error);
  }
}

/**
 * Clear star measurement cache
 */
export function clearStarCountCache(): void {
  starCountCache.clear();
}
