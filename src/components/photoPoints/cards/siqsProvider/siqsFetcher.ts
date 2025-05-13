
/**
 * SIQS fetching service
 */

import { updateSiqsCache } from './cacheManager';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
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
