
import { calculateRealTimeSiqs, batchCalculateSiqs } from '../realTimeSiqsService';
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { isWaterLocation } from '@/utils/locationValidator';
import { isNationalParkBoundary } from '@/utils/locationClassifier';
import { estimateBortleScale } from '@/utils/map/locationAnalysis';

// Enhanced cache with multi-level structure for better performance
interface SiqsData {
  siqs: number;
  timestamp: number;
  isViable: boolean;
  confidence: 'high' | 'medium' | 'low';
  terrain?: string;
}

// Improved caching system with regional partitioning
const locationCache = new Map<string, SiqsData>();

// Store regional data for faster initial estimates
const regionalDataCache = new Map<string, {
  avgSiqs: number;
  count: number;
  lastUpdate: number;
}>();

// Advanced cache duration settings with adaptive TTL
const BASE_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const EXTENDED_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours for high-quality data
const LOW_ACTIVITY_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours for stable regions

/**
 * Get optimal cache duration based on location characteristics and data confidence
 */
function getCacheDuration(latitude: number, longitude: number, confidence: 'high' | 'medium' | 'low'): number {
  // Night time locations can have longer cache duration
  const date = new Date();
  const hour = date.getHours();
  const isNightTime = hour >= 20 || hour <= 5;
  
  // Higher elevations tend to have more stable conditions
  const isRemoteRegion = latitude > 40 || latitude < -40 || longitude < -100 || longitude > 140;
  
  if (confidence === 'high' && (isNightTime || isRemoteRegion)) {
    return EXTENDED_CACHE_DURATION;
  } else if (confidence === 'medium' && isRemoteRegion) {
    return LOW_ACTIVITY_CACHE_DURATION;
  }
  
  return BASE_CACHE_DURATION;
}

/**
 * Update locations with real-time SIQS data using advanced adaptive algorithm
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  viewType: 'certified' | 'calculated' = 'calculated'
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  console.log(`Updating ${locations.length} locations with real-time SIQS for view: ${viewType}`);
  
  // Scale processing based on device capabilities
  const devicePerformance = detectDevicePerformance();
  const maxLocationsToProcess = devicePerformance === 'high' ? 75 : 
                               devicePerformance === 'medium' ? 50 : 25;
  
  // Early return if there are too many locations
  if (locations.length > maxLocationsToProcess) {
    console.warn(`Too many locations (${locations.length}) for real-time SIQS update. Limiting to first ${maxLocationsToProcess}`);
    return locations.slice(0, maxLocationsToProcess);
  }
  
  // Clone the locations to avoid mutating the original
  const updatedLocations = [...locations];
  
  // Adaptive parallel requests based on network conditions and view type
  const networkQuality = await estimateNetworkQuality();
  const maxParallel = networkQuality === 'good' ? (viewType === 'certified' ? 5 : 8) :
                      networkQuality === 'medium' ? (viewType === 'certified' ? 3 : 5) : 2;
  
  try {
    // Enhanced location filtering with terrain analysis for improved accuracy
    const locationsToUpdate = filterLocationsForUpdate(updatedLocations, viewType);
    
    // If no locations meet the criteria for update, return original list
    if (locationsToUpdate.length === 0) {
      return updatedLocations;
    }
    
    // Use spatial partitioning for more efficient batch processing
    const partitionedLocations = partitionLocationsByRegion(locationsToUpdate);
    
    for (const partition of partitionedLocations) {
      // Process each partition with optimal batch size
      for (let i = 0; i < partition.length; i += maxParallel) {
        const batch = partition.slice(i, i + maxParallel);
        
        // Pre-fill with regional estimates for immediate feedback
        applyRegionalEstimates(batch);
        
        // Prepare batch data with enhanced metadata
        const batchData = preprocessBatchData(batch);
        
        // Process batch with advanced error handling and retries
        const batchResults = await processBatchWithRetries(batchData);
        
        // Apply results with confidence scoring
        applyBatchResults(batch, batchResults);
        
        // Allow UI updates between batches
        if (i + maxParallel < partition.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
    
    // Update regional cache with new data for future estimates
    updateRegionalCache(locationsToUpdate);
  } catch (error) {
    console.error(`Error updating locations with real-time SIQS:`, error);
    // Apply fallback estimates to ensure UI has data
    applyFallbackEstimates(updatedLocations);
  }
  
  return updatedLocations;
}

/**
 * Filter locations that need updating based on sophisticated criteria
 */
function filterLocationsForUpdate(locations: SharedAstroSpot[], viewType: 'certified' | 'calculated'): SharedAstroSpot[] {
  return viewType === 'calculated'
    ? locations.filter(loc => {
        // In calculated view, don't update certified locations
        if (loc.isDarkSkyReserve || loc.certification) {
          return false;
        }
        
        // Filter out water locations with improved detection
        if (isWaterLocation(loc.latitude, loc.longitude)) {
          return false;
        }
        
        // Check cache status with precise expiration
        const cacheKey = `${loc.latitude?.toFixed(4)}-${loc.longitude?.toFixed(4)}`;
        const cachedData = locationCache.get(cacheKey);
        
        if (cachedData) {
          const cacheDuration = getCacheDuration(
            loc.latitude || 0, 
            loc.longitude || 0, 
            cachedData.confidence
          );
          
          if (Date.now() - cachedData.timestamp < cacheDuration) {
            // Use cached data if still valid
            loc.siqs = cachedData.siqs;
            loc.isViable = cachedData.isViable;
            return false;
          }
        }
        
        return true;
      })
    : locations.filter(loc => 
        // In certified view, only update certified locations
        (loc.isDarkSkyReserve || loc.certification || viewType === 'certified') &&
        // Check cache status
        !isCacheValid(loc)
      );
}

/**
 * Check if cached data is still valid with adaptive expiration
 */
function isCacheValid(location: SharedAstroSpot): boolean {
  if (!location.latitude || !location.longitude) return false;
  
  const cacheKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
  const cachedData = locationCache.get(cacheKey);
  
  if (!cachedData) return false;
  
  const cacheDuration = getCacheDuration(
    location.latitude,
    location.longitude,
    cachedData.confidence || 'medium'
  );
  
  return (Date.now() - cachedData.timestamp) < cacheDuration;
}

/**
 * Partition locations by geographic region for more efficient processing
 */
function partitionLocationsByRegion(locations: SharedAstroSpot[]): SharedAstroSpot[][] {
  // For small sets, no need to partition
  if (locations.length <= 10) return [locations];
  
  // Group locations by approximate 5° grid cells
  const partitions = new Map<string, SharedAstroSpot[]>();
  
  locations.forEach(loc => {
    if (!loc.latitude || !loc.longitude) return;
    
    // Create grid cell key (5° x 5° cells)
    const cellKey = `${Math.floor(loc.latitude / 5) * 5}-${Math.floor(loc.longitude / 5) * 5}`;
    
    if (!partitions.has(cellKey)) {
      partitions.set(cellKey, []);
    }
    
    partitions.get(cellKey)?.push(loc);
  });
  
  return Array.from(partitions.values());
}

/**
 * Apply regional estimates for immediate UI feedback while actual data loads
 */
function applyRegionalEstimates(locations: SharedAstroSpot[]): void {
  locations.forEach(loc => {
    if (!loc.latitude || !loc.longitude) return;
    
    const regionKey = `${Math.floor(loc.latitude / 2)}-${Math.floor(loc.longitude / 2)}`;
    const regionalData = regionalDataCache.get(regionKey);
    
    // If we have regional data, use it as initial estimate
    if (regionalData && regionalData.count >= 3) {
      // Only apply if location doesn't already have SIQS data
      if (loc.siqs === undefined || loc.siqs === null) {
        const estimatedBortle = estimateBortleScale(loc.latitude, loc.longitude);
        // Adjust regional average based on estimated Bortle scale difference
        const bortleDiff = (estimatedBortle - 5) * 0.5; // Adjust by half point per Bortle scale unit
        loc.siqs = Math.max(1, Math.min(10, regionalData.avgSiqs - bortleDiff));
        loc.isViable = loc.siqs >= 5;
      }
    }
  });
}

/**
 * Preprocess batch data with enhanced metadata for more accurate results
 */
function preprocessBatchData(batch: SharedAstroSpot[]): Array<any> {
  return batch.map(location => {
    // Enhanced location data with terrain and environmental factors
    let terrain = 'unknown';
    
    // Simple terrain detection based on coordinates
    if (location.latitude && location.longitude) {
      // Check for national parks (likely darker skies)
      if (isNationalParkBoundary(location.latitude, location.longitude)) {
        terrain = 'protected';
      }
      // Mountains (typically darker skies, above 1000m)
      else if (isLikelyMountain(location.latitude, location.longitude)) {
        terrain = 'mountain';
      }
      // Desert regions (often dark but with clear skies)
      else if (isLikelyDesert(location.latitude, location.longitude)) {
        terrain = 'desert';
      }
    }
    
    return {
      id: location.id || '',
      name: location.name || '',
      timestamp: location.timestamp || '',
      latitude: location.latitude,
      longitude: location.longitude,
      bortleScale: location.bortleScale || 4,
      terrain: terrain
    };
  });
}

/**
 * Process batch with advanced error handling and retries
 */
async function processBatchWithRetries(batchData: any[]): Promise<any[]> {
  const MAX_RETRIES = 2;
  let attempts = 0;
  let results: any[] = [];
  
  while (attempts <= MAX_RETRIES) {
    try {
      results = await batchCalculateSiqs(batchData);
      break;
    } catch (error) {
      attempts++;
      console.warn(`Batch processing error (attempt ${attempts}):`, error);
      
      if (attempts <= MAX_RETRIES) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempts - 1)));
      } else {
        throw error;
      }
    }
  }
  
  return results;
}

/**
 * Apply batch results to locations with confidence scoring
 */
function applyBatchResults(batch: SharedAstroSpot[], results: any[]): void {
  for (let j = 0; j < batch.length; j++) {
    const result = results[j];
    if (result && typeof result.siqs === 'number') {
      batch[j].siqs = result.siqs;
      batch[j].isViable = result.isViable;
      
      // Cache with confidence level based on data quality
      try {
        if (batch[j].latitude && batch[j].longitude) {
          const cacheKey = `${batch[j].latitude.toFixed(4)}-${batch[j].longitude.toFixed(4)}`;
          
          // Determine confidence level based on data completeness
          const confidence = determineConfidenceLevel(result);
          
          locationCache.set(cacheKey, {
            siqs: result.siqs,
            isViable: result.isViable,
            timestamp: Date.now(),
            confidence
          });
        }
      } catch (cacheError) {
        console.warn("Failed to cache location result:", cacheError);
      }
    }
  }
}

/**
 * Update regional cache with new SIQS data for future estimates
 */
function updateRegionalCache(locations: SharedAstroSpot[]): void {
  // Group locations by region
  const regionData = new Map<string, {total: number, count: number}>();
  
  locations.forEach(loc => {
    if (!loc.latitude || !loc.longitude || typeof loc.siqs !== 'number') return;
    
    const regionKey = `${Math.floor(loc.latitude / 2)}-${Math.floor(loc.longitude / 2)}`;
    
    if (!regionData.has(regionKey)) {
      regionData.set(regionKey, {total: 0, count: 0});
    }
    
    const data = regionData.get(regionKey)!;
    data.total += loc.siqs;
    data.count++;
  });
  
  // Update regional cache
  regionData.forEach((data, key) => {
    if (data.count >= 3) { // Only store regions with enough data points
      regionalDataCache.set(key, {
        avgSiqs: data.total / data.count,
        count: data.count,
        lastUpdate: Date.now()
      });
    }
  });
}

/**
 * Determine confidence level based on data quality and completeness
 */
function determineConfidenceLevel(result: any): 'high' | 'medium' | 'low' {
  // Check for availability of detailed data
  const hasDetailedFactors = result.factors && result.factors.length >= 3;
  
  // If we have multiple data factors, confidence is higher
  if (hasDetailedFactors) return 'high';
  
  // Check value consistency
  const isReasonableValue = result.siqs >= 1 && result.siqs <= 10;
  
  return isReasonableValue ? 'medium' : 'low';
}

/**
 * Apply fallback estimates to ensure UI always has data
 */
function applyFallbackEstimates(locations: SharedAstroSpot[]): void {
  locations.forEach(loc => {
    if (!loc.siqs && loc.latitude && loc.longitude) {
      // Use Bortle scale to estimate SIQS
      const bortle = loc.bortleScale || estimateBortleScale(loc.latitude, loc.longitude);
      const estimatedSiqs = 10 - bortle; // Simple inverse relationship
      
      loc.siqs = Math.max(1, Math.min(10, estimatedSiqs));
      loc.isViable = loc.siqs >= 5;
    }
  });
}

/**
 * Simple device performance detection
 */
function detectDevicePerformance(): 'high' | 'medium' | 'low' {
  try {
    // Check for memory constraints
    const memory = (navigator as any).deviceMemory;
    if (memory && memory <= 2) return 'low';
    
    // Check for hardware concurrency
    const cores = navigator.hardwareConcurrency;
    if (cores && cores >= 8) return 'high';
    if (cores && cores >= 4) return 'medium';
    
    // Default to medium
    return 'medium';
  } catch (_) {
    return 'medium'; // Safe default
  }
}

/**
 * Estimate network quality
 */
async function estimateNetworkQuality(): Promise<'good' | 'medium' | 'poor'> {
  try {
    const connection = (navigator as any).connection;
    
    if (connection) {
      if (connection.effectiveType === '4g') return 'good';
      if (connection.effectiveType === '3g') return 'medium';
      return 'poor';
    }
    
    // Simple network test
    const start = Date.now();
    const response = await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
    const duration = Date.now() - start;
    
    if (duration < 100) return 'good';
    if (duration < 300) return 'medium';
    return 'poor';
  } catch (_) {
    return 'medium'; // Safe default
  }
}

/**
 * Simple heuristic to check if coordinates are likely in mountainous terrain
 */
function isLikelyMountain(latitude: number, longitude: number): boolean {
  // Major mountain ranges approximation
  // Rockies
  if ((latitude >= 35 && latitude <= 60) && (longitude >= -125 && longitude <= -105)) return true;
  // Alps
  if ((latitude >= 43 && latitude <= 48) && (longitude >= 5 && longitude <= 16)) return true;
  // Himalayas
  if ((latitude >= 27 && latitude <= 35) && (longitude >= 70 && longitude <= 95)) return true;
  // Andes
  if ((latitude >= -55 && latitude <= 12) && (longitude >= -80 && longitude <= -65)) return true;
  
  return false;
}

/**
 * Simple heuristic to check if coordinates are likely in desert terrain
 */
function isLikelyDesert(latitude: number, longitude: number): boolean {
  // Major desert regions approximation
  // Sahara
  if ((latitude >= 15 && latitude <= 30) && (longitude >= -15 && longitude <= 35)) return true;
  // Arabian
  if ((latitude >= 15 && latitude <= 30) && (longitude >= 35 && longitude <= 60)) return true;
  // Australian
  if ((latitude >= -30 && latitude <= -20) && (longitude >= 120 && longitude <= 140)) return true;
  // Southwestern US
  if ((latitude >= 30 && latitude <= 40) && (longitude >= -120 && longitude <= -105)) return true;
  
  return false;
}

/**
 * Clear the location cache
 */
export function clearLocationCache(): void {
  const size = locationCache.size;
  locationCache.clear();
  console.log(`Location cache cleared (${size} entries removed)`);
}
