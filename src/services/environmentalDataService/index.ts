
import { getBortleScale } from './bortleScaleService';
import { getWeatherData, getCachedWeatherData, clearWeatherCache } from './weatherService';

// Re-export functions from the service modules
export { 
  getBortleScale,
  getWeatherData,
  getCachedWeatherData,
  clearWeatherCache
};

/**
 * Get environmental data for a location
 */
export const getEnvironmentalData = async (latitude: number, longitude: number) => {
  try {
    // Get Bortle scale for the location
    const bortleScale = getBortleScale(latitude, longitude);
    
    return {
      bortleScale,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting environmental data:", error);
    return {
      bortleScale: 4, // Default value
      timestamp: new Date().toISOString()
    };
  }
};
