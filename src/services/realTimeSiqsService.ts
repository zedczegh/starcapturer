
/**
 * Real-time SIQS calculation service
 */
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface SiqsCalculationResult {
  siqs: number;
  isViable: boolean;
  factors?: Record<string, number>;
}

// Store for caching SIQS calculations
const siqsCache = new Map<string, { result: SiqsCalculationResult; timestamp: number }>();

/**
 * Calculate real-time SIQS for a location
 */
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number = 5
): Promise<SiqsCalculationResult> {
  try {
    // Generate cache key
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale}`;
    
    // Check cache (valid for 30 minutes)
    const cachedResult = siqsCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < 30 * 60 * 1000) {
      return cachedResult.result;
    }
    
    // Mock calculation for demonstration purposes
    // In a real implementation, this would call weather APIs and other services
    
    // Adjust base SIQS by Bortle scale (higher Bortle = lower SIQS)
    const bortleFactor = Math.max(0, 10 - bortleScale * 1.1);
    
    // Weather factor (mock)
    const weatherFactor = Math.random() * 3 + 7; // 7-10
    
    // Moon factor (mock)
    const moonFactor = Math.random() * 3 + 7; // 7-10
    
    // Calculate total SIQS
    const rawSiqs = (bortleFactor * 0.6 + weatherFactor * 0.3 + moonFactor * 0.1);
    
    // Normalize to 0-10 scale
    const normalizedSiqs = Math.max(0, Math.min(10, rawSiqs));
    
    // Determine if location is viable for astrophotography
    const isViable = normalizedSiqs >= 3.5;
    
    // Create result
    const result: SiqsCalculationResult = {
      siqs: parseFloat(normalizedSiqs.toFixed(1)),
      isViable,
      factors: {
        bortle: bortleFactor,
        weather: weatherFactor,
        moon: moonFactor
      }
    };
    
    // Cache the result
    siqsCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return {
      siqs: 0,
      isViable: false
    };
  }
}

/**
 * Clear the SIQS cache
 */
export function clearSiqsCache(): void {
  siqsCache.clear();
}
