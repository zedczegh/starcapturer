
import { calculateRealTimeSiqs, batchCalculateSiqs } from './siqsCalculator';
import { BatchSiqsOptions, BatchSiqsResult, SiqsResult } from './siqsTypes';

/**
 * Intelligent SIQS batch processor with priority queue and smart resource management
 */
class SiqsBatchProcessor {
  private queue: Array<{
    priority: number;
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    abortController: AbortController;
  }> = [];
  
  private running = 0;
  private maxConcurrent = 3;
  private isProcessing = false;
  
  /**
   * Process a batch of locations for SIQS calculation efficiently
   * 
   * @param locations Array of location data to process
   * @param options Batch processing options
   * @returns Promise resolving to an array of locations with SIQS results
   */
  async processBatch(
    locations: Array<{ latitude: number; longitude: number; bortleScale?: number; priority?: number }>,
    options: BatchSiqsOptions = {}
  ): Promise<BatchSiqsResult[]> {
    if (!locations || locations.length === 0) {
      return [];
    }
    
    const {
      concurrencyLimit = 3,
      timeout = 30000,
      ...calculationOptions
    } = options;
    
    this.maxConcurrent = concurrencyLimit;
    console.log(`Batch calculating SIQS for ${locations.length} locations with concurrency ${concurrencyLimit}`);
    
    // Use a timeout to ensure we return results even if not all locations are processed
    const timeoutPromise = new Promise<BatchSiqsResult[]>(resolve => {
      setTimeout(() => {
        const partialResults = this.collectPartialResults(locations);
        console.warn(`Batch processing timed out after ${timeout}ms, returning ${partialResults.length} results`);
        resolve(partialResults);
      }, timeout);
    });
    
    try {
      // Sort locations by priority if specified
      const sortedLocations = [...locations].sort((a, b) => {
        const priorityA = a.priority !== undefined ? a.priority : 1;
        const priorityB = b.priority !== undefined ? b.priority : 1;
        return priorityB - priorityA; // Higher priority first
      });
      
      // Create tasks for each location
      const taskPromises = sortedLocations.map((location, index) => {
        const priority = location.priority !== undefined ? location.priority : 1;
        
        return new Promise<BatchSiqsResult>((resolve, reject) => {
          const abortController = new AbortController();
          
          this.queue.push({
            priority,
            abortController,
            resolve,
            reject,
            task: async () => {
              try {
                const startTime = Date.now();
                
                // Signal to task if we need to abort
                const signal = abortController.signal;
                if (signal.aborted) {
                  throw new Error('Task aborted');
                }
                
                const siqsResult = await calculateRealTimeSiqs(
                  location.latitude,
                  location.longitude,
                  location.bortleScale || 5,
                  calculationOptions
                );
                
                const processingTime = Date.now() - startTime;
                console.log(`Processed location ${index + 1}/${locations.length} in ${processingTime}ms`);
                
                return {
                  location,
                  siqsResult,
                  timestamp: Date.now(),
                  confidence: 8 // High confidence for direct calculation
                };
              } catch (error) {
                console.error(`Error processing location ${index + 1}/${locations.length}:`, error);
                return {
                  location,
                  siqsResult: { 
                    siqs: 0, 
                    isViable: false,
                    factors: [{
                      name: 'Error',
                      score: 0,
                      description: 'Failed to calculate SIQS'
                    }]
                  },
                  timestamp: Date.now(),
                  confidence: 0
                };
              }
            }
          });
        });
      });
      
      // Start processing the queue
      this.processQueue();
      
      // Race between normal processing and timeout
      return Promise.race([
        Promise.all(taskPromises),
        timeoutPromise
      ]);
    } catch (error) {
      console.error("Error in batch SIQS calculation:", error);
      return locations.map(location => ({
        location,
        siqsResult: { 
          siqs: 0, 
          isViable: false,
          factors: [{
            name: 'Error',
            score: 0,
            description: 'Failed to calculate SIQS'
          }]
        },
        timestamp: Date.now(),
        confidence: 0
      }));
    }
  }
  
  /**
   * Process items from the queue according to priority
   */
  private processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    const processNext = () => {
      if (this.running >= this.maxConcurrent || this.queue.length === 0) {
        this.isProcessing = false;
        return;
      }
      
      // Sort queue by priority
      this.queue.sort((a, b) => b.priority - a.priority);
      
      // Get highest priority task
      const item = this.queue.shift();
      if (!item) {
        this.isProcessing = false;
        return;
      }
      
      this.running++;
      
      // Execute the task
      item.task()
        .then(result => item.resolve(result))
        .catch(error => item.reject(error))
        .finally(() => {
          this.running--;
          // Process next item
          processNext();
        });
    };
    
    // Start processing items
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      processNext();
    }
    
    this.isProcessing = false;
  }
  
  /**
   * Collect partial results for locations that haven't been processed yet
   */
  private collectPartialResults(locations: Array<{ latitude: number; longitude: number; bortleScale?: number; priority?: number }>): BatchSiqsResult[] {
    // Create placeholder results for unprocessed locations
    return locations.map(location => ({
      location,
      siqsResult: { 
        siqs: 0, 
        isViable: false,
        factors: [{
          name: 'Timeout',
          score: 0,
          description: 'Processing timed out'
        }]
      },
      timestamp: Date.now(),
      confidence: 0
    }));
  }
  
  /**
   * Cancel all pending tasks in the queue
   */
  cancelAll() {
    this.queue.forEach(item => {
      item.abortController.abort();
      item.reject(new Error('Task cancelled'));
    });
    this.queue = [];
  }
}

// Create singleton instance
const batchProcessor = new SiqsBatchProcessor();

/**
 * Process a batch of locations for SIQS calculation efficiently
 * 
 * @param locations Array of location data to process
 * @param options Batch processing options
 * @returns Promise resolving to an array of locations with SIQS results
 */
export async function processBatchSiqs(
  locations: Array<{ latitude: number; longitude: number; bortleScale?: number; priority?: number }>,
  options: BatchSiqsOptions = {}
): Promise<BatchSiqsResult[]> {
  return batchProcessor.processBatch(locations, options);
}

/**
 * Cancel all pending batch operations
 */
export function cancelBatchOperations(): void {
  batchProcessor.cancelAll();
}

/**
 * Legacy function for compatibility
 */
export async function batchCalculateSiqs(
  locations: any[]
): Promise<any[]> {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  console.log(`Legacy batch calculating SIQS for ${locations.length} locations`);
  
  try {
    // Process locations in parallel for efficiency but with a concurrency limit
    const results = await Promise.all(
      locations.map(async location => {
        const siqsResult = await calculateRealTimeSiqs(
          location.latitude, 
          location.longitude, 
          location.bortleScale || 5
        );
        
        // Merge SIQS results with the original location data
        return {
          ...location,
          siqs: siqsResult.siqs,
          isViable: siqsResult.isViable,
          siqsResult: {
            score: siqsResult.siqs,
            isViable: siqsResult.isViable,
            factors: siqsResult.factors || []
          }
        };
      })
    );
    
    return results;
  } catch (error) {
    console.error("Error in batch SIQS calculation:", error);
    return locations.map(location => ({
      ...location,
      siqs: 0, 
      isViable: false
    }));
  }
}

// Export as alias for backward compatibility
export const batchCalculateRealTimeSiqs = batchCalculateSiqs;
