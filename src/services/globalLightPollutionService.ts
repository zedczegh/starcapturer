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

// Grid resolution in degrees (0.25 degrees = ~27km at equator)
// This provides town-level granularity
const GRID_RESOLUTION = 0.25;

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

  console.log('Calculating initial global light pollution data...');
  const grid = generateGlobalGrid();
  
  // Calculate a smaller initial sample for quick display
  const strategicLocations = grid.filter((coord, index) => 
    index % 20 === 0 // Sample every 20th point for faster initial load
  );

  const regions = await calculateBortleScaleForRegions(strategicLocations, onProgress);
  saveLightPollutionRegions(regions);
  
  return regions;
};

/**
 * Get calculation progress from localStorage
 */
export const getCalculationProgress = (): {
  processedCount: number;
  totalCount: number;
  isComplete: boolean;
  lastProcessedIndex: number;
} => {
  try {
    const data = localStorage.getItem('lightPollutionProgress');
    if (!data) {
      return { processedCount: 0, totalCount: 0, isComplete: false, lastProcessedIndex: 0 };
    }
    return JSON.parse(data);
  } catch {
    return { processedCount: 0, totalCount: 0, isComplete: false, lastProcessedIndex: 0 };
  }
};

/**
 * Save calculation progress to localStorage
 */
export const saveCalculationProgress = (
  processedCount: number,
  totalCount: number,
  isComplete: boolean,
  lastProcessedIndex: number
): void => {
  try {
    localStorage.setItem('lightPollutionProgress', JSON.stringify({
      processedCount,
      totalCount,
      isComplete,
      lastProcessedIndex,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error saving calculation progress:', error);
  }
};

/**
 * Background calculation service that progressively calculates all regions
 */
export const startBackgroundCalculation = (
  onProgress?: (current: number, total: number, percentage: number) => void,
  onComplete?: () => void
): () => void => {
  let isRunning = true;
  
  const processNextBatch = async () => {
    if (!isRunning) return;

    const progress = getCalculationProgress();
    const grid = generateGlobalGrid();
    const totalPoints = grid.length;

    if (progress.isComplete || progress.lastProcessedIndex >= totalPoints) {
      console.log('Background calculation already complete');
      onComplete?.();
      return;
    }

    // Process in small batches to avoid blocking
    const BATCH_SIZE = 10;
    const startIndex = progress.lastProcessedIndex;
    const endIndex = Math.min(startIndex + BATCH_SIZE, totalPoints);
    const batch = grid.slice(startIndex, endIndex);

    console.log(`Processing batch ${startIndex}-${endIndex} of ${totalPoints}`);

    // Load existing regions
    const existingRegions = loadLightPollutionRegions() || [];
    
    // Calculate new regions for this batch
    const newRegions = await calculateBortleScaleForRegions(batch);
    
    // Merge with existing regions
    const allRegions = [...existingRegions, ...newRegions];
    saveLightPollutionRegions(allRegions);

    // Update progress
    const processedCount = endIndex;
    const percentage = Math.round((processedCount / totalPoints) * 100);
    const isComplete = endIndex >= totalPoints;
    
    saveCalculationProgress(processedCount, totalPoints, isComplete, endIndex);
    onProgress?.(processedCount, totalPoints, percentage);

    if (isComplete) {
      console.log('Background calculation complete!');
      onComplete?.();
    } else {
      // Schedule next batch using requestIdleCallback for true background processing
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => processNextBatch(), { timeout: 5000 });
      } else {
        setTimeout(() => processNextBatch(), 100);
      }
    }
  };

  // Start processing
  processNextBatch();

  // Return cleanup function
  return () => {
    isRunning = false;
  };
};
