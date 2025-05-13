
/**
 * SIQS request queue manager
 * Handles batching and processing of SIQS requests
 */

import { BatchJob } from './types';
import { processSiqsBatch } from './siqsFetcher';

// Queue for pending SIQS requests
const siqsRequestQueue: BatchJob[] = [];
let isProcessing = false;
let batchTimer: ReturnType<typeof setTimeout> | null = null;

// Maximum number of requests to process in a single batch
const MAX_BATCH_SIZE = 5;
// Time to wait before processing a batch (ms)
const BATCH_WAIT_TIME = 300;

/**
 * Add a request to the SIQS processing queue
 */
export const queueSiqsRequest = (
  id: string,
  latitude: number,
  longitude: number,
  bortleScale: number = 5,
  cacheKey?: string
): void => {
  // Check if request with same coordinates already exists
  const existingIndex = siqsRequestQueue.findIndex(
    job => job.latitude === latitude && job.longitude === longitude
  );
  
  // Update existing request or add new one
  if (existingIndex >= 0) {
    siqsRequestQueue[existingIndex] = {
      id,
      latitude,
      longitude,
      bortleScale,
      cacheKey
    };
  } else {
    siqsRequestQueue.push({
      id,
      latitude,
      longitude,
      bortleScale,
      cacheKey
    });
  }
  
  // Schedule batch processing if not already scheduled
  if (!batchTimer) {
    batchTimer = setTimeout(processBatch, BATCH_WAIT_TIME);
  }
};

/**
 * Process a batch of queued SIQS requests
 */
export const processBatch = async (): Promise<void> => {
  // Clear timer
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  
  // If already processing or queue is empty, return
  if (isProcessing || siqsRequestQueue.length === 0) {
    return;
  }
  
  isProcessing = true;
  
  try {
    // Take a batch of requests from the queue
    const batchSize = Math.min(MAX_BATCH_SIZE, siqsRequestQueue.length);
    const batch = siqsRequestQueue.splice(0, batchSize);
    
    // Process the batch
    await processSiqsBatch(batch);
    
    // Schedule next batch if queue not empty
    if (siqsRequestQueue.length > 0) {
      batchTimer = setTimeout(processBatch, BATCH_WAIT_TIME);
    }
  } catch (error) {
    console.error('Error processing SIQS batch:', error);
  } finally {
    isProcessing = false;
  }
};

/**
 * Clear all pending SIQS requests
 */
export const clearSiqsQueue = (): void => {
  siqsRequestQueue.length = 0;
  
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
};

export default {
  queueSiqsRequest,
  processBatch,
  clearSiqsQueue
};
