
/**
 * SIQS fetching service
 */

import { updateSiqsCache } from './cacheManager';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { logSiqsCalculation } from '@/services/siqs/siqsLogger';
import { supabase } from '@/integrations/supabase/client';
import { BatchJob } from './types';

// Function to call the SIQS service
export const callSiqsService = async (
  latitude: number, 
  longitude: number,
  bortleScale: number
): Promise<any> => {
  try {
    const result = await calculateRealTimeSiqs(
      latitude,
      longitude,
      bortleScale,
      {
        useSingleHourSampling: true,
        targetHour: 1,
        cacheDurationMins: 5
      }
    );
    
    return result;
  } catch (error) {
    console.error("Error fetching SIQS data:", error);
    throw error;
  }
}

// Batch process SIQS requests
export const processSiqsBatch = async (jobs: BatchJob[]): Promise<Map<string, any>> => {
  const results = new Map<string, any>();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  // Process jobs sequentially to avoid overwhelming API
  for (const job of jobs) {
    try {
      // Skip if we don't have enough data
      if (!job.latitude || !job.longitude) continue;
      
      const result = await callSiqsService(
        job.latitude,
        job.longitude,
        job.bortleScale || 5
      );
      
      // Store result if valid
      if (result) {
        results.set(job.id, result);
        
        // Update cache if needed
        if (job.cacheKey) {
          updateSiqsCache(job.cacheKey, result);
        }
        
        // Log to database for analytics (async, don't block)
        logSiqsCalculation({
          latitude: job.latitude,
          longitude: job.longitude,
          locationName: `Photopoint ${job.latitude.toFixed(4)}, ${job.longitude.toFixed(4)}`,
          siqsScore: result.siqs || 0,
          astroNightCloudCover: result.weatherData?.nighttimeCloudData?.average || null,
          additionalMetadata: {
            bortleScale: job.bortleScale || 5,
            source: 'photopoint'
          },
          userId: userId,
          source: 'photopoint'
        }).catch(err => console.warn('Failed to log SIQS:', err));
      }
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
    }
  }
  
  return results;
};

export default {
  callSiqsService,
  processSiqsBatch
};
