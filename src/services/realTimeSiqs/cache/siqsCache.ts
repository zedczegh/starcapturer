
import { SiqsResult } from '../siqsTypes';

// In-memory cache across all provider instances
const memoizedResults = new Map<string, {result: SiqsResult; timestamp: number}>();
const MEMO_EXPIRY = 5 * 60 * 1000; // 5 minutes

const spatialCache = new Map<string, {result: SiqsResult; timestamp: number}>();
const SPATIAL_PRECISION = 0.05; // About 5km spatial precision 
const SPATIAL_EXPIRY = 30 * 60 * 1000; // 30 minutes

export function getSpatialCacheKey(latitude: number, longitude: number): string {
  const roundedLat = Math.round(latitude / SPATIAL_PRECISION) * SPATIAL_PRECISION;
  const roundedLng = Math.round(longitude / SPATIAL_PRECISION) * SPATIAL_PRECISION;
  return `spatial-${roundedLat.toFixed(4)}-${roundedLng.toFixed(4)}`;
}

export function areLocationsNearby(lat1: number, lon1: number, lat2: number, lon2: number, thresholdKm: number = 5): boolean {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c <= thresholdKm;
}

export function getMemoizedResult(cacheKey: string): SiqsResult | null {
  const cached = memoizedResults.get(cacheKey);
  return (cached && (Date.now() - cached.timestamp) < MEMO_EXPIRY) ? cached.result : null;
}

export function setMemoizedResult(cacheKey: string, result: SiqsResult): void {
  memoizedResults.set(cacheKey, { result, timestamp: Date.now() });
}

export function checkSpatialCache(latitude: number, longitude: number): SiqsResult | null {
  const spatialKey = getSpatialCacheKey(latitude, longitude);
  const cachedData = spatialCache.get(spatialKey);
  
  if (cachedData && (Date.now() - cachedData.timestamp) < SPATIAL_EXPIRY) {
    return cachedData.result;
  }
  
  for (const [key, data] of spatialCache.entries()) {
    if ((Date.now() - data.timestamp) < SPATIAL_EXPIRY) {
      const [, latStr, lngStr] = key.split('-');
      const cachedLat = parseFloat(latStr);
      const cachedLng = parseFloat(lngStr);
      
      if (areLocationsNearby(latitude, longitude, cachedLat, cachedLng)) {
        console.log(`Using nearby spatial cache (${cachedLat}, ${cachedLng}) for (${latitude}, ${longitude})`);
        return data.result;
      }
    }
  }
  
  return null;
}

export function setSpatialCache(latitude: number, longitude: number, result: SiqsResult): void {
  const spatialKey = getSpatialCacheKey(latitude, longitude);
  spatialCache.set(spatialKey, { result, timestamp: Date.now() });
}

export function clearSiqsCaches(): void {
  memoizedResults.clear();
  spatialCache.clear();
  console.log("All SIQS caches cleared");
}
