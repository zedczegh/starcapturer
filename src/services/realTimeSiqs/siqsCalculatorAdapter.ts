
/**
 * Adapter for SIQS calculation with improved error handling
 */

import { calculateRealTimeSiqs } from '../../utils/siqs/siqsCalculator';
import type { SiqsCalculationOptions, SiqsCalculationResult } from '../../utils/siqs/types';

/**
 * Calculate real-time SIQS with enhanced error handling and logging
 */
export async function calculateSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number = 4,
  options: SiqsCalculationOptions = {}
): Promise<SiqsCalculationResult> {
  try {
    // Validate input parameters
    if (!isFinite(latitude) || !isFinite(longitude)) {
      console.error('Invalid coordinates provided for SIQS calculation:', { latitude, longitude });
      throw new Error('Invalid coordinates');
    }
    
    if (!isFinite(bortleScale) || bortleScale < 1 || bortleScale > 9) {
      console.warn('Invalid Bortle scale provided, using default:', bortleScale);
      bortleScale = 4;
    }
    
    console.log(`Calculating SIQS for [${latitude.toFixed(4)}, ${longitude.toFixed(4)}] with Bortle scale ${bortleScale}`);
    
    // Call the actual calculation function with timing measurement
    const startTime = performance.now();
    const result = await calculateRealTimeSiqs(latitude, longitude, bortleScale, options);
    const endTime = performance.now();
    
    console.log(`SIQS calculation completed in ${(endTime - startTime).toFixed(1)}ms. Result:`, result.siqs);
    
    return result;
  } catch (error) {
    console.error('Error in SIQS calculation:', error);
    
    // Return a fallback result
    return {
      siqs: 0,
      isViable: false,
      factors: [{
        name: 'Error',
        score: 0,
        description: 'Failed to calculate SIQS'
      }],
      metadata: {
        calculatedAt: new Date().toISOString(),
        sources: {},
        reliability: {
          score: 0,
          issues: ['Calculation error']
        }
      }
    };
  }
}

// Re-export the original function for compatibility
export { calculateRealTimeSiqs };
