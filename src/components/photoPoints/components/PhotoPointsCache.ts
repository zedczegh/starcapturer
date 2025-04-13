
import { SharedAstroSpot } from '@/lib/api/astroSpots';

// Load cached locations from localStorage
export const loadCachedLocations = (): SharedAstroSpot[] => {
  try {
    const savedLocations = localStorage.getItem('cachedRecommendedLocations');
    if (savedLocations) {
      const parsed = JSON.parse(savedLocations);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error loading cached locations:", error);
  }
  return [];
};

// Save locations to localStorage cache
export const saveCachedLocations = (locations: SharedAstroSpot[]): void => {
  try {
    localStorage.setItem('cachedRecommendedLocations', JSON.stringify(locations));
  } catch (error) {
    console.error("Error saving locations to cache:", error);
  }
};
