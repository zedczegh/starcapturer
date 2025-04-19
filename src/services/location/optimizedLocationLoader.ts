
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { generateQualitySpots } from '../locationSpotService';
import { sessionStorageAvailable } from '@/utils/storageCheck';

const BATCH_SIZE = 5;
const MEMORY_CACHE = new Map<string, {
  data: SharedAstroSpot[];
  timestamp: number;
}>();

// Add event system for location updates
const locationUpdateListeners: (() => void)[] = [];

export const loadCalculatedLocations = async (
  latitude: number,
  longitude: number,
  radius: number,
  limit: number = 10
): Promise<SharedAstroSpot[]> => {
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${radius}`;
  const now = Date.now();
  const cached = MEMORY_CACHE.get(cacheKey);

  // Use in-memory cache only for the SAME location (5 minute validity)
  if (cached && (now - cached.timestamp) < 5 * 60 * 1000) {
    console.log(`Using in-memory cached locations for ${cacheKey}`);
    return cached.data;
  }

  try {
    console.log(`Generating fresh locations for ${latitude.toFixed(6)},${longitude.toFixed(6)} with radius ${radius}km`);
    
    // Generate locations in batches
    const spots = await generateQualitySpots(latitude, longitude, radius, limit);
    
    // Store in memory cache
    MEMORY_CACHE.set(cacheKey, {
      data: spots,
      timestamp: now
    });

    // Try to store in session storage as backup
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

export const clearLocationCache = () => {
  MEMORY_CACHE.clear();
  if (sessionStorageAvailable()) {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('calc_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
  // Notify listeners that cache was cleared
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
