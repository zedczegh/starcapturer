import { supabase } from "@/integrations/supabase/client";
import { getBortleScaleData } from "./environmentalDataService";

/**
 * Service for calculating and storing global light pollution data
 * Creates a grid of Bortle scale measurements across the globe
 */

export interface LightPollutionRegion {
  id: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

// Grid resolution in degrees (2 degrees = ~220km at equator)
const GRID_RESOLUTION = 2;

/**
 * Generate a global grid of coordinates for light pollution calculation
 */
export const generateGlobalGrid = (): Array<{ lat: number; lng: number }> => {
  const coordinates: Array<{ lat: number; lng: number }> = [];
  
  // Cover the globe with a grid
  for (let lat = -90; lat <= 90; lat += GRID_RESOLUTION) {
    for (let lng = -180; lng <= 180; lng += GRID_RESOLUTION) {
      coordinates.push({ lat, lng });
    }
  }
  
  return coordinates;
};

/**
 * Calculate Bortle scale for a batch of coordinates
 */
export const calculateBortleScaleForRegions = async (
  coordinates: Array<{ lat: number; lng: number }>,
  onProgress?: (current: number, total: number) => void
): Promise<LightPollutionRegion[]> => {
  const regions: LightPollutionRegion[] = [];
  const total = coordinates.length;

  // Simple cache handlers for the calculation
  const cache = new Map<string, any>();
  const getCachedData = (key: string) => cache.get(key) || null;
  const setCachedData = (key: string, data: any) => cache.set(key, data);

  for (let i = 0; i < coordinates.length; i++) {
    const { lat, lng } = coordinates[i];
    
    try {
      const bortleScale = await getBortleScaleData(
        lat,
        lng,
        `Region ${lat},${lng}`,
        null,
        true,
        getCachedData,
        setCachedData,
        'en',
        undefined,
        3000 // Shorter timeout for batch processing
      );

      if (bortleScale !== null) {
        regions.push({
          id: `${lat}-${lng}`,
          latitude: lat,
          longitude: lng,
          bortleScale,
          bounds: {
            north: lat + GRID_RESOLUTION / 2,
            south: lat - GRID_RESOLUTION / 2,
            east: lng + GRID_RESOLUTION / 2,
            west: lng - GRID_RESOLUTION / 2,
          }
        });
      }

      if (onProgress && i % 10 === 0) {
        onProgress(i + 1, total);
      }
    } catch (error) {
      console.warn(`Error calculating Bortle scale for ${lat},${lng}:`, error);
    }
  }

  return regions;
};

/**
 * Save calculated regions to local storage
 */
export const saveLightPollutionRegions = (regions: LightPollutionRegion[]): void => {
  try {
    localStorage.setItem('globalLightPollutionRegions', JSON.stringify({
      regions,
      timestamp: Date.now(),
      version: 1
    }));
    console.log(`Saved ${regions.length} light pollution regions`);
  } catch (error) {
    console.error('Error saving light pollution regions:', error);
  }
};

/**
 * Load calculated regions from local storage
 */
export const loadLightPollutionRegions = (): LightPollutionRegion[] | null => {
  try {
    const data = localStorage.getItem('globalLightPollutionRegions');
    if (!data) return null;

    const parsed = JSON.parse(data);
    const ageInDays = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24);

    // Data is valid for 30 days
    if (ageInDays > 30) {
      console.log('Light pollution data is outdated');
      return null;
    }

    console.log(`Loaded ${parsed.regions.length} light pollution regions`);
    return parsed.regions;
  } catch (error) {
    console.error('Error loading light pollution regions:', error);
    return null;
  }
};

/**
 * Get Bortle scale color for visualization
 */
export const getBortleColor = (bortleScale: number): string => {
  const colors: Record<number, string> = {
    1: '#001a33', // Excellent dark sky - very dark blue
    2: '#003366', // Typical dark sky - dark blue
    3: '#004d99', // Rural sky - blue
    4: '#0066cc', // Rural/suburban - lighter blue
    5: '#ffcc00', // Suburban sky - yellow
    6: '#ff9900', // Bright suburban - orange
    7: '#ff6600', // Suburban/urban - bright orange
    8: '#ff3300', // City sky - red
    9: '#cc0000', // Inner city - dark red
  };
  
  return colors[Math.round(bortleScale)] || colors[5];
};

/**
 * Initialize or update global light pollution data
 */
export const initializeGlobalLightPollutionData = async (
  onProgress?: (current: number, total: number) => void
): Promise<LightPollutionRegion[]> => {
  // Try to load existing data first
  const existingData = loadLightPollutionRegions();
  if (existingData && existingData.length > 0) {
    console.log('Using cached global light pollution data');
    return existingData;
  }

  console.log('Calculating global light pollution data...');
  const grid = generateGlobalGrid();
  
  // For initial implementation, calculate a subset of strategic locations
  // Full global calculation would take too long
  const strategicLocations = grid.filter((coord, index) => 
    index % 5 === 0 // Sample every 5th point for faster initial load
  );

  const regions = await calculateBortleScaleForRegions(strategicLocations, onProgress);
  saveLightPollutionRegions(regions);
  
  return regions;
};
