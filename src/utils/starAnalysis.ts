
/**
 * High-performance star analysis utilities for more accurate Bortle scale measurements
 */
import { countStarsInImage, calculateBortleFromStars } from './starCountUtils';

// Cache to store recent star count measurements with improved confidence metrics
const starCountCache = new Map<string, {
  bortleScale: number;
  timestamp: number;
  confidence: 'high' | 'medium' | 'low';
  imageConditions?: {
    skyBrightness: number;
    cloudCover?: number;
    moonPhase?: number;
  };
}>();

/**
 * Get Bortle scale based on star counts for a given location
 * Uses both cached and real-time measurements with confidence weighting
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
  
  // Check cache first (valid for 14 days for high confidence, 7 days for medium)
  const cachedData = starCountCache.get(cacheKey);
  const highConfidenceCacheLimit = 14 * 24 * 60 * 60 * 1000; // 14 days for high confidence
  const mediumConfidenceCacheLimit = 7 * 24 * 60 * 60 * 1000; // 7 days for medium confidence
  const lowConfidenceCacheLimit = 3 * 24 * 60 * 60 * 1000; // 3 days for low confidence
  
  // Use appropriate cache limit based on confidence
  const cacheAgeLimit = cachedData?.confidence === 'high' 
    ? highConfidenceCacheLimit 
    : (cachedData?.confidence === 'medium' ? mediumConfidenceCacheLimit : lowConfidenceCacheLimit);
  
  if (cachedData && (Date.now() - cachedData.timestamp) < cacheAgeLimit) {
    console.log(`Using cached star count Bortle scale: ${cachedData.bortleScale} (confidence: ${cachedData.confidence})`);
    return cachedData.bortleScale;
  }
  
  try {
    // Check if we have any star measurements in local storage with improved multi-point integration
    const measurements = await getLocalStarMeasurements();
    
    if (measurements.length === 0) return null;
    
    // Find measurements close to this location with distance weighting
    const nearbyMeasurements = measurements.filter(m => {
      // Calculate distance (improved Haversine formula for better accuracy)
      const R = 6371; // Earth radius in km
      const lat1 = m.latitude * Math.PI/180;
      const lat2 = latitude * Math.PI/180;
      const dLat = (latitude - m.latitude) * Math.PI/180;
      const dLon = (longitude - m.longitude) * Math.PI/180;
      
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      // Consider measurements within ~15km (approximately 0.15 degrees) instead of 10km
      return distance < 15;
    });
    
    if (nearbyMeasurements.length > 0) {
      // Sort by distance and recency (weighted combination)
      nearbyMeasurements.sort((a, b) => {
        // Calculate distances
        const distA = Math.sqrt(
          Math.pow(a.latitude - latitude, 2) + 
          Math.pow(a.longitude - longitude, 2)
        );
        const distB = Math.sqrt(
          Math.pow(b.latitude - latitude, 2) + 
          Math.pow(b.longitude - longitude, 2)
        );
        
        // Calculate age in days
        const ageA = (Date.now() - new Date(a.timestamp).getTime()) / (24 * 60 * 60 * 1000);
        const ageB = (Date.now() - new Date(b.timestamp).getTime()) / (24 * 60 * 60 * 1000);
        
        // Combined score (70% distance, 30% recency)
        const scoreA = distA * 0.7 + ageA * 0.3;
        const scoreB = distB * 0.7 + ageB * 0.3;
        
        return scoreA - scoreB;
      });
      
      // If we have multiple measurements, use weighted average of the closest 3
      let finalBortleScale: number;
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      
      if (nearbyMeasurements.length >= 3) {
        // Use weighted average of top 3 measurements for more stability
        const topMeasurements = nearbyMeasurements.slice(0, 3);
        
        // Calculate weights based on distance and recency
        const weights = topMeasurements.map(m => {
          const dist = Math.sqrt(
            Math.pow(m.latitude - latitude, 2) + 
            Math.pow(m.longitude - longitude, 2)
          );
          const ageInDays = (Date.now() - new Date(m.timestamp).getTime()) / (24 * 60 * 60 * 1000);
          
          // Exponential decay based on distance and age
          return Math.exp(-dist * 10) * Math.exp(-ageInDays / 30);
        });
        
        // Normalize weights
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        const normalizedWeights = weights.map(w => w / totalWeight);
        
        // Calculate weighted average
        finalBortleScale = topMeasurements.reduce((sum, m, i) => sum + m.bortleScale * normalizedWeights[i], 0);
        
        // Round to nearest 0.5 for readability
        finalBortleScale = Math.round(finalBortleScale * 2) / 2;
        
        // High confidence when measurements are consistent and recent
        const maxDiff = Math.max(...topMeasurements.map(m => Math.abs(m.bortleScale - finalBortleScale)));
        const maxAge = Math.max(...topMeasurements.map(m => 
          (Date.now() - new Date(m.timestamp).getTime()) / (24 * 60 * 60 * 1000)
        ));
        
        if (maxDiff < 1 && maxAge < 60) {
          confidence = 'high';
        }
      } else {
        // Use the closest measurement
        const closestMeasurement = nearbyMeasurements[0];
        finalBortleScale = closestMeasurement.bortleScale;
        
        // Calculate confidence based on measurement age and distance
        const ageInDays = (Date.now() - new Date(closestMeasurement.timestamp).getTime()) / (24 * 60 * 60 * 1000);
        const distInDegrees = Math.sqrt(
          Math.pow(closestMeasurement.latitude - latitude, 2) + 
          Math.pow(closestMeasurement.longitude - longitude, 2)
        );
        
        // High confidence: recent and very close
        if (ageInDays < 30 && distInDegrees < 0.02) {
          confidence = 'high';
        } 
        // Low confidence: old or far
        else if (ageInDays > 180 || distInDegrees > 0.05) {
          confidence = 'low';
        }
      }
      
      console.log(`Found nearby star measurements for Bortle scale: ${finalBortleScale.toFixed(1)} (confidence: ${confidence})`);
      
      // Cache the result
      starCountCache.set(cacheKey, {
        bortleScale: finalBortleScale,
        timestamp: Date.now(),
        confidence
      });
      
      return finalBortleScale;
    }
  } catch (error) {
    console.error("Error getting star count Bortle scale:", error);
  }
  
  // No measurements available
  return null;
}

/**
 * Get all star measurements from local storage with enhanced error handling
 */
async function getLocalStarMeasurements(): Promise<{
  latitude: number;
  longitude: number;
  bortleScale: number;
  starCount: number | null;
  timestamp: string;
}[]> {
  try {
    // Try localStorage first
    const measurementsString = localStorage.getItem('star_measurements');
    const bortleMeasurementsString = localStorage.getItem('bortleMeasurements');
    
    const allMeasurements = [];
    
    // Process star measurements
    if (measurementsString) {
      try {
        const starMeasurements = JSON.parse(measurementsString);
        if (Array.isArray(starMeasurements)) {
          allMeasurements.push(...starMeasurements);
        }
      } catch (e) {
        console.error("Error parsing star measurements:", e);
      }
    }
    
    // Also include Bortle measurements that have starCount
    if (bortleMeasurementsString) {
      try {
        const bortleMeasurements = JSON.parse(bortleMeasurementsString);
        if (Array.isArray(bortleMeasurements)) {
          // Only include measurements with star counts (from camera)
          const validBortleMeasurements = bortleMeasurements
            .filter(m => m.starCount !== null && m.method === 'camera')
            .map(m => ({
              latitude: m.latitude,
              longitude: m.longitude,
              bortleScale: m.bortleScale,
              starCount: m.starCount,
              timestamp: m.timestamp
            }));
            
          allMeasurements.push(...validBortleMeasurements);
        }
      } catch (e) {
        console.error("Error parsing Bortle measurements:", e);
      }
    }
    
    // Sort by recency
    return allMeasurements.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error("Error reading star measurements:", error);
    return [];
  }
}

/**
 * Process star measurement from camera image with enhanced image analysis
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
  // Count stars in image using our enhanced algorithm
  const starCount = countStarsInImage(imageData);
  
  // Calculate average sky brightness with improved noise filtering
  let totalBrightness = 0;
  let pixelCount = 0;
  let brightPixels = 0;
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i+1];
    const b = imageData.data[i+2];
    
    // Weighted brightness calculation (human eye is more sensitive to green)
    const brightness = r * 0.299 + g * 0.587 + b * 0.114;
    
    // Only include darker pixels in average (exclude stars and bright objects)
    if (brightness < 160) {
      totalBrightness += brightness;
      pixelCount++;
    } else {
      brightPixels++;
    }
  }
  
  // Calculate and apply cloud detection heuristic
  // High bright pixel ratio often indicates clouds or light pollution
  const brightPixelRatio = brightPixels / (brightPixels + pixelCount);
  let cloudCoverEstimate = 0;
  
  if (brightPixelRatio > 0.4) {
    cloudCoverEstimate = Math.min(100, brightPixelRatio * 200);
    console.log(`Detected possible clouds: ${cloudCoverEstimate.toFixed(0)}% cloud cover estimate`);
  }
  
  const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 128;
  
  // Apply correction factor for potential clouds/haze when brightness is high but stars are many
  let adjustedBrightness = avgBrightness;
  if (starCount > 50 && avgBrightness > 100) {
    // This indicates potential thin clouds or haze that passes stars but increases sky glow
    adjustedBrightness = avgBrightness * 0.8;
    console.log("Applying haze correction to sky brightness");
  }
  
  // Calculate Bortle scale from stars and brightness
  const bortleScale = calculateBortleFromStars(starCount, adjustedBrightness);
  
  // Save measurement to local storage
  saveStarMeasurement(latitude, longitude, bortleScale, starCount, avgBrightness, cloudCoverEstimate);
  
  // Also cache the result with image conditions
  const cacheKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
  starCountCache.set(cacheKey, {
    bortleScale,
    timestamp: Date.now(),
    confidence: 'high', // Direct measurement has high confidence
    imageConditions: {
      skyBrightness: avgBrightness,
      cloudCover: cloudCoverEstimate
    }
  });
  
  return { bortleScale, starCount };
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
  cloudCover: number
): void {
  try {
    // Get existing measurements
    const measurementsString = localStorage.getItem('star_measurements');
    const measurements = measurementsString ? JSON.parse(measurementsString) : [];
    
    // Calculate moon phase estimate based on date
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Simplified moon phase calculation (0 = new moon, 0.5 = full moon, 1 = new moon)
    // Based on lunar cycle of 29.53 days
    const lunarCycle = 29.53;
    // New moon on January 1, 2000 as reference point
    const refDate = new Date(2000, 0, 1);
    const daysSinceRef = (date.getTime() - refDate.getTime()) / (24 * 60 * 60 * 1000);
    const moonPhase = (daysSinceRef % lunarCycle) / lunarCycle;
    
    // Add new measurement with enhanced metadata
    measurements.push({
      latitude,
      longitude,
      bortleScale,
      starCount,
      timestamp: new Date().toISOString(),
      method: 'camera',
      imageData: {
        skyBrightness,
        cloudCover,
        moonPhase,
        deviceInfo: navigator.userAgent
      }
    });
    
    // Limit to most recent 200 measurements (increased from 100)
    if (measurements.length > 200) {
      measurements.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      measurements.splice(200);
    }
    
    // Save back to local storage
    localStorage.setItem('star_measurements', JSON.stringify(measurements));
    
    // Also save to bortleMeasurements for compatibility with other components
    try {
      const bortleMeasurements = JSON.parse(localStorage.getItem('bortleMeasurements') || '[]');
      bortleMeasurements.push({
        latitude,
        longitude,
        bortleScale,
        starCount,
        timestamp: new Date().toISOString(),
        method: 'camera',
        skyBrightness,
        cloudCover
      });
      
      // Limit size
      if (bortleMeasurements.length > 200) {
        bortleMeasurements.sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        bortleMeasurements.splice(200);
      }
      
      localStorage.setItem('bortleMeasurements', JSON.stringify(bortleMeasurements));
    } catch (e) {
      console.error("Error updating bortleMeasurements:", e);
    }
    
    console.log(`Saved star measurement: ${starCount} stars, Bortle ${bortleScale.toFixed(1)}, brightness ${skyBrightness.toFixed(1)}`);
  } catch (error) {
    console.error("Error saving star measurement:", error);
  }
}

/**
 * Clear star measurement cache
 * @param maxAge Optional maximum age in milliseconds
 */
export function clearStarCountCache(maxAge?: number): void {
  if (maxAge) {
    // Clear only expired entries
    const now = Date.now();
    let count = 0;
    
    for (const [key, value] of starCountCache.entries()) {
      if (now - value.timestamp > maxAge) {
        starCountCache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      console.log(`Cleared ${count} expired star count cache entries`);
    }
  } else {
    // Clear all entries
    const count = starCountCache.size;
    starCountCache.clear();
    console.log(`Cleared all ${count} star count cache entries`);
  }
}
