
/**
 * High-performance star analysis utilities for more accurate Bortle scale measurements
 */
import { countStarsInImage, calculateBortleFromStars } from './starCountUtils';
import { bortleToMpsas, mpsasToBortle } from './darkSkyMeterUtils';

// Enhanced cache to store recent star count measurements with metadata
const starCountCache = new Map<string, {
  bortleScale: number;
  timestamp: number;
  confidence: 'high' | 'medium' | 'low';
  metadata?: {
    starCount?: number;
    imageQuality?: number;
    skyBrightness?: number;
    mpsas?: number;
    sensorType?: string;
  };
}>();

/**
 * Get Bortle scale based on star counts for a given location
 * Uses both cached and real-time measurements with enhanced accuracy
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
    
    // Find measurements close to this location with enhanced weighting
    const nearbyMeasurements = measurements.filter(m => {
      // Calculate distance (simplified using ~111km per degree)
      const latDiff = Math.abs(m.latitude - latitude);
      const lngDiff = Math.abs(m.longitude - longitude);
      const distanceInDegrees = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      // Consider measurements within ~10km (approximately 0.09 degrees)
      return distanceInDegrees < 0.09;
    });
    
    if (nearbyMeasurements.length > 0) {
      // Enhanced sorting that considers both distance and recency
      nearbyMeasurements.sort((a, b) => {
        // Calculate distance weight
        const distA = Math.sqrt(
          Math.pow(a.latitude - latitude, 2) + 
          Math.pow(a.longitude - longitude, 2)
        ) * 111; // Convert to km
        const distB = Math.sqrt(
          Math.pow(b.latitude - latitude, 2) + 
          Math.pow(b.longitude - longitude, 2)
        ) * 111; // Convert to km
        
        // Calculate time weight (days)
        const timeA = (Date.now() - new Date(a.timestamp).getTime()) / (24 * 60 * 60 * 1000);
        const timeB = (Date.now() - new Date(b.timestamp).getTime()) / (24 * 60 * 60 * 1000);
        
        // Combined score (lower is better)
        const scoreA = distA * 0.6 + timeA * 0.4;
        const scoreB = distB * 0.6 + timeB * 0.4;
        
        return scoreA - scoreB;
      });
      
      // Use the best measurement
      const bestMeasurement = nearbyMeasurements[0];
      console.log(`Found nearby star measurement at ${bestMeasurement.latitude}, ${bestMeasurement.longitude} with Bortle ${bestMeasurement.bortleScale}`);
      
      // Calculate confidence based on measurement age, distance, and quality
      const ageInDays = (Date.now() - new Date(bestMeasurement.timestamp).getTime()) / (24 * 60 * 60 * 1000);
      const distInKm = Math.sqrt(
        Math.pow(bestMeasurement.latitude - latitude, 2) + 
        Math.pow(bestMeasurement.longitude - longitude, 2)
      ) * 111;
      
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      
      // High confidence: recent and very close
      if (ageInDays < 14 && distInKm < 2) {
        confidence = 'high';
      } 
      // Low confidence: old or far
      else if (ageInDays > 60 || distInKm > 5) {
        confidence = 'low';
      }
      
      // Cache the result with metadata
      starCountCache.set(cacheKey, {
        bortleScale: bestMeasurement.bortleScale,
        timestamp: Date.now(),
        confidence,
        metadata: {
          starCount: bestMeasurement.starCount || undefined,
          skyBrightness: bestMeasurement.skyBrightness,
          mpsas: bestMeasurement.mpsas
        }
      });
      
      return bestMeasurement.bortleScale;
    }
    
    // If we have multiple measurements but none very close, try to interpolate
    if (measurements.length > 5) {
      try {
        const interpolatedBortle = interpolateBortleFromMeasurements(
          latitude, 
          longitude, 
          measurements.filter(m => {
            // Use measurements within 50km for interpolation
            const latDiff = Math.abs(m.latitude - latitude);
            const lngDiff = Math.abs(m.longitude - longitude);
            const distanceInDegrees = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
            return distanceInDegrees < 0.45; // ~50km
          })
        );
        
        if (interpolatedBortle) {
          console.log(`Interpolated Bortle scale from nearby measurements: ${interpolatedBortle}`);
          
          // Cache the interpolated result with lower confidence
          starCountCache.set(cacheKey, {
            bortleScale: interpolatedBortle,
            timestamp: Date.now(),
            confidence: 'medium'
          });
          
          return interpolatedBortle;
        }
      } catch (error) {
        console.error("Error interpolating Bortle scale:", error);
      }
    }
  } catch (error) {
    console.error("Error getting star count Bortle scale:", error);
  }
  
  // No measurements available
  return null;
}

/**
 * Interpolate Bortle scale based on surrounding measurements
 * Uses inverse distance weighting algorithm
 */
function interpolateBortleFromMeasurements(
  latitude: number,
  longitude: number,
  measurements: ReturnType<typeof getLocalStarMeasurements> extends Promise<infer T> ? T[number][] : never
): number | null {
  if (measurements.length === 0) return null;
  if (measurements.length === 1) return measurements[0].bortleScale;
  
  let weightSum = 0;
  let valueSum = 0;
  
  for (const m of measurements) {
    // Calculate distance in km
    const latDiff = Math.abs(m.latitude - latitude);
    const lngDiff = Math.abs(m.longitude - longitude);
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
    
    // Skip measurements that are exactly at the target point (would cause division by zero)
    if (distance < 0.001) return m.bortleScale;
    
    // Inverse distance weighting
    const weight = 1 / (distance * distance);
    weightSum += weight;
    valueSum += m.bortleScale * weight;
    
    // Apply age weight - newer measurements count more
    const ageInDays = (Date.now() - new Date(m.timestamp).getTime()) / (24 * 60 * 60 * 1000);
    const ageWeight = 1 / (1 + ageInDays / 30); // Half weight after 30 days
    
    weightSum *= ageWeight;
    valueSum *= ageWeight;
  }
  
  if (weightSum === 0) return null;
  
  return Math.round(valueSum / weightSum * 2) / 2; // Round to nearest 0.5
}

/**
 * Get all star measurements from local storage with enhanced data structure
 */
async function getLocalStarMeasurements(): Promise<{
  latitude: number;
  longitude: number;
  bortleScale: number;
  starCount: number | null;
  skyBrightness?: number;
  mpsas?: number;
  imageQuality?: number;
  timestamp: string;
  method: 'camera' | 'location' | 'manual';
}[]> {
  try {
    const measurementsString = localStorage.getItem('star_measurements');
    if (measurementsString) {
      const measurements = JSON.parse(measurementsString);
      
      // Sort by timestamp (newest first)
      measurements.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      return measurements;
    }
  } catch (error) {
    console.error("Error reading star measurements:", error);
  }
  
  return [];
}

/**
 * Process star measurement from camera image with enhanced analysis
 * @param imageData Camera image data
 * @param latitude Current latitude
 * @param longitude Current longitude
 * @returns Calculated Bortle scale and star count
 */
export async function processStarMeasurement(
  imageData: ImageData,
  latitude: number,
  longitude: number
): Promise<{ bortleScale: number, starCount: number, imageQuality: number, mpsas: number }> {
  // Count stars in image using enhanced algorithm
  const starCount = countStarsInImage(imageData);
  
  // Calculate average sky brightness with improved noise filtering
  let totalBrightness = 0;
  let pixelCount = 0;
  
  // Analyze image quality
  let contrastSum = 0;
  let noiseEstimate = 0;
  let previousBrightness = 0;
  const brightnessSamples: number[] = [];
  
  for (let i = 0; i < imageData.data.length; i += 16) { // Sample every 4th pixel in both dimensions
    const r = imageData.data[i];
    const g = imageData.data[i+1];
    const b = imageData.data[i+2];
    
    // Use perceptual brightness formula
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    brightnessSamples.push(brightness);
    
    // Only include darker pixels in average (exclude stars and bright objects)
    if (brightness < 180) {
      totalBrightness += brightness;
      pixelCount++;
    }
    
    // Calculate contrast
    if (previousBrightness > 0) {
      contrastSum += Math.abs(brightness - previousBrightness);
    }
    previousBrightness = brightness;
  }
  
  const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 128;
  
  // Calculate noise estimate using standard deviation
  if (brightnessSamples.length > 0) {
    let sum = 0;
    for (const b of brightnessSamples) {
      sum += Math.pow(b - avgBrightness, 2);
    }
    noiseEstimate = Math.sqrt(sum / brightnessSamples.length);
  }
  
  // Calculate image quality score (0-100)
  const contrastAvg = contrastSum / (brightnessSamples.length - 1);
  const imageQuality = Math.min(100, Math.max(0, 
    100 - (noiseEstimate * 2) + (contrastAvg * 0.5) - Math.abs(avgBrightness - 80) / 2
  ));
  
  // Calculate MPSAS (magnitude per square arcsecond) - standard astronomy measure
  const { rawBrightnessToMpsas } = await import('./darkSkyMeterUtils');
  const mpsas = rawBrightnessToMpsas(avgBrightness);
  
  // Calculate Bortle scale from stars and brightness
  const bortleScale = calculateBortleFromStars(starCount, avgBrightness);
  
  // Save measurement to local storage with enhanced metadata
  saveStarMeasurement(
    latitude, 
    longitude, 
    bortleScale, 
    starCount, 
    avgBrightness,
    mpsas, 
    imageQuality
  );
  
  // Also cache the result
  const cacheKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
  starCountCache.set(cacheKey, {
    bortleScale,
    timestamp: Date.now(),
    confidence: 'high', // Direct measurement has high confidence
    metadata: {
      starCount,
      imageQuality,
      skyBrightness: avgBrightness,
      mpsas
    }
  });
  
  return { bortleScale, starCount, imageQuality, mpsas };
}

/**
 * Save star measurement to local storage with enhanced metadata
 */
function saveStarMeasurement(
  latitude: number,
  longitude: number,
  bortleScale: number,
  starCount: number,
  skyBrightness: number,
  mpsas: number,
  imageQuality: number
): void {
  try {
    // Get existing measurements
    const measurementsString = localStorage.getItem('star_measurements');
    const measurements = measurementsString ? JSON.parse(measurementsString) : [];
    
    // Add new measurement with enhanced metadata
    measurements.push({
      latitude,
      longitude,
      bortleScale,
      starCount,
      skyBrightness,
      mpsas,
      imageQuality,
      timestamp: new Date().toISOString(),
      method: 'camera',
      deviceInfo: {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height
      }
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
    
    console.log(`Saved star measurement: ${starCount} stars, Bortle ${bortleScale}, MPSAS ${mpsas.toFixed(2)}, Quality ${imageQuality.toFixed(0)}%`);
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

/**
 * Get quality description for a star measurement
 * @param quality Quality score 0-100
 * @returns Text description of measurement quality
 */
export function getImageQualityDescription(quality: number): "excellent" | "good" | "fair" | "poor" | "unusable" {
  if (quality >= 80) return "excellent";
  if (quality >= 60) return "good";
  if (quality >= 40) return "fair";
  if (quality >= 20) return "poor";
  return "unusable";
}
