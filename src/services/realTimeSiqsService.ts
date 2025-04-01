
import { fetchForecastData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchWeatherData } from "@/lib/api/weather";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Create a cache with TTL mechanism
class SiqsCache {
  private cache = new Map<string, {
    siqs: number;
    timestamp: number;
    isViable: boolean;
  }>();
  
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
  private readonly LOW_PRIORITY_LOCATIONS = new Set<string>();
  private processingQueue: string[] = [];
  private isProcessing = false;
  
  constructor() {
    // Periodically clean expired entries
    setInterval(() => this.cleanExpiredEntries(), this.CACHE_DURATION);
  }
  
  get(key: string): { siqs: number; isViable: boolean } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if entry is still valid
    if (Date.now() - entry.timestamp < this.CACHE_DURATION) {
      return { siqs: entry.siqs, isViable: entry.isViable };
    }
    
    // Entry expired
    return null;
  }
  
  set(key: string, data: { siqs: number; isViable: boolean }): void {
    this.cache.set(key, {
      ...data,
      timestamp: Date.now()
    });
  }
  
  size(): number {
    return this.cache.size;
  }
  
  clear(): void {
    this.cache.clear();
    this.LOW_PRIORITY_LOCATIONS.clear();
    this.processingQueue = [];
  }
  
  markAsLowPriority(key: string): void {
    this.LOW_PRIORITY_LOCATIONS.add(key);
  }
  
  isLowPriority(key: string): boolean {
    return this.LOW_PRIORITY_LOCATIONS.has(key);
  }
  
  addToProcessingQueue(key: string): void {
    if (!this.processingQueue.includes(key)) {
      this.processingQueue.push(key);
    }
  }
  
  getNextFromQueue(): string | undefined {
    // First process high priority locations
    const highPriorityIndex = this.processingQueue.findIndex(
      key => !this.isLowPriority(key)
    );
    
    if (highPriorityIndex !== -1) {
      return this.processingQueue.splice(highPriorityIndex, 1)[0];
    }
    
    // Then process low priority ones
    return this.processingQueue.shift();
  }
  
  startProcessing(): void {
    this.isProcessing = true;
  }
  
  stopProcessing(): void {
    this.isProcessing = false;
  }
  
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }
  
  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }
}

// Create a single instance of the cache
const siqsCache = new SiqsCache();

/**
 * Calculate real-time SIQS for a given location
 * Optimized with prioritization and caching
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @param bortleScale Bortle scale of the location (light pollution)
 * @returns Promise resolving to SIQS score and viability
 */
export async function calculateRealTimeSiqs(
  latitude: number, 
  longitude: number, 
  bortleScale: number
): Promise<{ siqs: number; isViable: boolean }> {
  // Generate cache key
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Check cache first
  const cachedData = siqsCache.get(cacheKey);
  if (cachedData) {
    console.log(`Using cached SIQS data for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, score: ${cachedData.siqs.toFixed(1)}`);
    return cachedData;
  }
  
  console.log(`Calculating real-time SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  
  try {
    // Fetch weather data
    const weatherData = await fetchWeatherData({
      latitude,
      longitude
    });
    
    // Fetch forecast data for nighttime calculation
    const forecastData = await fetchForecastData({
      latitude,
      longitude,
      days: 2
    });
    
    // Default values if API calls fail
    if (!weatherData) {
      return { siqs: 0, isViable: false };
    }
    
    // For light pollution, use provided Bortle scale or fetch it
    let finalBortleScale = bortleScale;
    if (!finalBortleScale || finalBortleScale <= 0) {
      try {
        const pollutionData = await fetchLightPollutionData(latitude, longitude);
        finalBortleScale = pollutionData?.bortleScale || 5;
      } catch (err) {
        console.error("Error fetching light pollution data:", err);
        finalBortleScale = 5; // Default fallback
      }
    }
    
    // Calculate SIQS using optimized method
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherData,
      finalBortleScale,
      3, // Default seeing conditions
      0.5, // Default moon phase
      forecastData
    );
    
    console.log(`Calculated SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}: ${siqsResult.score.toFixed(1)}`);
    
    // Ensure SIQS is positive
    const finalSiqs = Math.max(0, siqsResult.score);
    const isViable = finalSiqs >= 2.0; // Consistent threshold with other parts of the app
    
    // Store in cache
    siqsCache.set(cacheKey, {
      siqs: finalSiqs,
      isViable: isViable
    });
    
    return {
      siqs: finalSiqs,
      isViable: isViable
    };
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return { siqs: 0, isViable: false };
  }
}

/**
 * Batch process multiple locations for SIQS calculation
 * with smart prioritization and adaptive parallelization
 * @param locations Array of locations to process
 * @param maxParallel Maximum number of parallel requests
 * @returns Promise resolving to locations with updated SIQS
 */
export async function batchCalculateSiqs(
  locations: SharedAstroSpot[],
  maxParallel: number = 3
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  console.log(`Batch calculating SIQS for ${locations.length} locations`);
  
  // Clone the locations array to avoid mutating the original
  const updatedLocations = [...locations];
  
  // Sort locations by distance (prioritize closer ones)
  updatedLocations.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  
  // Smart parallelization with browser tab visibility tracking
  const adjustedParallel = document.hidden ? 1 : maxParallel;
  
  // Queue everything first, then process
  const processQueue = async () => {
    const pendingPromises: Promise<void>[] = [];
    
    for (let i = 0; i < updatedLocations.length; i++) {
      const location = updatedLocations[i];
      if (!location.latitude || !location.longitude) continue;
      
      const cacheKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
      
      // Far locations are lower priority
      if (location.distance && location.distance > 100) {
        siqsCache.markAsLowPriority(cacheKey);
      }
      
      siqsCache.addToProcessingQueue(cacheKey);
    }
    
    // Start processing the queue
    if (!siqsCache.isCurrentlyProcessing()) {
      siqsCache.startProcessing();
      await processNextBatch(adjustedParallel);
      siqsCache.stopProcessing();
    }
    
    return updatedLocations;
  };
  
  // Process locations in controlled batches
  const processNextBatch = async (parallelCount: number): Promise<void> => {
    const batch: Promise<void>[] = [];
    
    for (let i = 0; i < parallelCount; i++) {
      const key = siqsCache.getNextFromQueue();
      if (!key) break; // No more keys to process
      
      const [latStr, lngStr] = key.split('-');
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      
      if (isNaN(lat) || isNaN(lng)) continue;
      
      // Find the corresponding location
      const locationIndex = updatedLocations.findIndex(
        loc => Math.abs(loc.latitude - lat) < 0.001 && Math.abs(loc.longitude - lng) < 0.001
      );
      
      if (locationIndex === -1) continue;
      
      const location = updatedLocations[locationIndex];
      
      batch.push(
        calculateRealTimeSiqs(lat, lng, location.bortleScale)
          .then(result => {
            updatedLocations[locationIndex] = {
              ...location,
              siqs: result.siqs,
              isViable: result.isViable
            };
          })
          .catch(error => {
            console.error(`Error calculating SIQS for ${key}:`, error);
            // Fallback calculation based on bortleScale
            const fallbackSiqs = Math.max(0, 10 - (location.bortleScale || 5));
            updatedLocations[locationIndex] = {
              ...location,
              siqs: fallbackSiqs,
              isViable: fallbackSiqs >= 2.0
            };
          })
      );
    }
    
    if (batch.length > 0) {
      await Promise.all(batch);
      
      // If there are more items in the queue, continue processing
      if (siqsCache.getNextFromQueue() !== undefined) {
        await processNextBatch(parallelCount);
      }
    }
  };
  
  return processQueue();
}

/**
 * Clear the SIQS cache for testing or debugging
 */
export function clearSiqsCache(): void {
  const size = siqsCache.size();
  siqsCache.clear();
  console.log(`SIQS cache cleared (${size} entries removed)`);
}

/**
 * Get the current SIQS cache size
 * @returns Number of cached entries
 */
export function getSiqsCacheSize(): number {
  return siqsCache.size();
}

/**
 * Prefetch SIQS data for a set of locations in the background
 * This can be called when loading a page to prepare data
 * @param locations Array of locations to prefetch
 */
export function prefetchSiqsData(locations: SharedAstroSpot[]): void {
  if (!locations || locations.length === 0) return;
  
  // Sort by distance and take the 5 closest
  const priorityLocations = [...locations]
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
    .slice(0, 5);
  
  // Do the prefetch in the background
  setTimeout(() => {
    batchCalculateSiqs(priorityLocations, 2)
      .then(() => console.log(`Prefetched SIQS data for ${priorityLocations.length} priority locations`))
      .catch(error => console.error("Error prefetching SIQS data:", error));
  }, 100);
}
