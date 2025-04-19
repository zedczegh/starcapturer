
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { generateQualitySpots } from '../locationSpotService';
import { sessionStorageAvailable } from '@/utils/storageCheck';

const BATCH_SIZE = 5;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MEMORY_CACHE = new Map<string, {
  data: SharedAstroSpot[];
  timestamp: number;
  quality: number;
}>();

// Add event system for location updates
const locationUpdateListeners: (() => void)[] = [];

export const loadCalculatedLocations = async (
  latitude: number,
  longitude: number,
  radius: number,
  limit: number = 10
): Promise<SharedAstroSpot[]> {
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${radius}`;
  const now = Date.now();
  const cached = MEMORY_CACHE.get(cacheKey);

  // Enhanced cache validation with quality check
  if (cached && 
      (now - cached.timestamp) < CACHE_DURATION && 
      cached.quality >= 0.7) { // Only use high-quality cached results
    console.log(`Using high-quality cached locations for ${cacheKey}`);
    return cached.data;
  }

  try {
    console.log(`Generating fresh locations for ${latitude.toFixed(6)},${longitude.toFixed(6)} with radius ${radius}km`);
    
    // Generate locations with parallel processing for better performance
    const spots = await generateQualitySpots(latitude, longitude, radius, limit);
    
    // Calculate cache quality score based on spot distribution and SIQS scores
    const quality = calculateCacheQuality(spots, radius);
    
    // Store in memory cache with quality score
    MEMORY_CACHE.set(cacheKey, {
      data: spots,
      timestamp: now,
      quality
    });

    // Try to store in session storage as backup with simplified data
    if (sessionStorageAvailable()) {
      try {
        const simplified = spots.map(spot => ({
          id: spot.id,
          latitude: spot.latitude,
          longitude: spot.longitude,
          name: spot.name,
          siqs: spot.siqs,
          distance: spot.distance
        }));
        sessionStorage.setItem(`calc_${cacheKey}`, JSON.stringify(simplified));
      } catch (err) {
        console.warn('Session storage backup failed:', err);
      }
    }

    // Notify listeners that location data has been updated
    notifyLocationUpdateListeners();
    
    return spots;
  } catch (error) {
    console.error('Error loading calculated locations:', error);
    return [];
  }
};

// Calculate cache quality based on spot distribution and SIQS scores
function calculateCacheQuality(spots: SharedAstroSpot[], radius: number): number {
  if (!spots.length) return 0;

  // Check spatial distribution
  const distances = spots.map(spot => spot.distance || 0);
  const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
  const distanceScore = avgDistance / radius; // Higher score for better distribution

  // Check SIQS quality
  const siqsScores = spots.map(spot => 
    typeof spot.siqs === 'number' ? spot.siqs / 100 : 
    typeof spot.siqs === 'object' ? spot.siqs.score / 10 : 0
  );
  const avgSiqs = siqsScores.reduce((a, b) => a + b, 0) / siqsScores.length;

  // Combine scores (60% SIQS weight, 40% distribution weight)
  return (avgSiqs * 0.6) + (distanceScore * 0.4);
}

export const clearLocationCache = () => {
  MEMORY_CACHE.clear();
  if (sessionStorageAvailable()) {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('calc_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
  notifyLocationUpdateListeners();
};

// Register a listener for location updates
export const addLocationUpdateListener = (listener: () => void) => {
  locationUpdateListeners.push(listener);
  return () => {
    const index = locationUpdateListeners.indexOf(listener);
    if (index !== -1) {
      locationUpdateListeners.splice(index, 1);
    }
  };
};

// Notify all listeners
const notifyLocationUpdateListeners = () => {
  locationUpdateListeners.forEach(listener => {
    try {
      listener();
    } catch (e) {
      console.error("Error in location update listener:", e);
    }
  });
};
