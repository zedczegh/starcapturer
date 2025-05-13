
/**
 * SIQS Fetcher - Handles requesting and processing SIQS data
 */

import { callSiqsService } from './cacheManager';
import { getDisplaySiqs, formatSiqsForDisplay } from '@/utils/unifiedSiqsDisplay';

// Define types for SIQS fetch options
export interface SiqsDisplayOpts {
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  confidence?: number;
  includeQuality?: boolean;
}

/**
 * Function to fetch SIQS data for a location
 */
export const fetchLocationSiqs = async (
  latitude: number, 
  longitude: number,
  options: {
    bortleScale?: number;
    existingSiqs?: any;
  } = {}
): Promise<{
  score: number | null;
  loading: boolean;
  confidence: number;
}> => {
  try {
    // Validate inputs
    if (!latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) {
      console.warn('Invalid coordinates for SIQS calculation:', latitude, longitude);
      return { score: null, loading: false, confidence: 0 };
    }

    // Get SIQS from service
    const result = await callSiqsService(latitude, longitude, options.bortleScale);
    
    if (result && typeof result === 'object') {
      if ('score' in result && typeof result.score === 'number') {
        // Extract confidence if available
        const confidence = 'confidence' in result && typeof result.confidence === 'number' 
          ? result.confidence 
          : 8;
        
        return {
          score: result.score,
          loading: false,
          confidence
        };
      }
    }
    
    // Try to use existing SIQS if available
    if (options.existingSiqs) {
      const existingScore = getDisplaySiqs(options.existingSiqs);
      if (existingScore !== null && existingScore > 0) {
        return {
          score: existingScore,
          loading: false,
          confidence: 7 // Lower confidence for existing/static scores
        };
      }
    }
    
    return { score: null, loading: false, confidence: 0 };
  } catch (error) {
    console.error('Error fetching SIQS:', error);
    return { score: null, loading: false, confidence: 0 };
  }
};

/**
 * Helper function to get formatted SIQS for display
 */
export const getFormattedSiqs = (siqs: any): string => {
  return formatSiqsForDisplay(siqs);
};

/**
 * Simple SIQS calculations based on available data
 */
export const calculateQuickSiqs = (cloudCover: number, bortleScale: number = 4): number => {
  // Base score determined by cloud cover (0-100%)
  const cloudScore = Math.max(0, 10 - (cloudCover / 10));
  
  // Adjust for Bortle scale
  const bortleAdjustment = Math.max(0, 5 - (bortleScale / 2));
  
  // Weighted combination (70% clouds, 30% light pollution)
  const rawScore = (cloudScore * 0.7) + (bortleAdjustment * 0.3);
  
  return Math.min(10, Math.max(0, Math.round(rawScore * 10) / 10));
};

