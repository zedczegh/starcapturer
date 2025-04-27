
import { getBortleScaleFromCoordinates } from '@/utils/bortleScaleUtils';
import { ChineseLocationData } from '@/data/regions/chinaCityLocations';

interface CachedDataFn {
  (key: string): any;
}

interface SetCachedDataFn {
  (key: string, value: any): void;
}

export async function getBortleScaleData(
  latitude: number,
  longitude: number,
  originalName: string,
  existingBortle: number | null,
  displayOnly: boolean,
  getCachedDataFn: CachedDataFn,
  setCachedDataFn: SetCachedDataFn,
  language: string
): Promise<number> {
  // Check if we already have the Bortle scale for this location
  if (existingBortle && existingBortle > 0 && existingBortle <= 9) {
    return existingBortle;
  }

  // Check cache first
  const cacheKey = `bortle-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  const cachedValue = getCachedDataFn(cacheKey);
  
  if (cachedValue !== undefined && cachedValue !== null) {
    return Number(cachedValue);
  }

  try {
    // Get Bortle scale from coordinates
    const bortleScale = await getBortleScaleFromCoordinates(latitude, longitude);
    
    // Cache the value
    if (bortleScale && !displayOnly) {
      setCachedDataFn(cacheKey, bortleScale);
    }
    
    return bortleScale;
  } catch (error) {
    console.error('Error fetching Bortle scale:', error);
    return 4; // Default value
  }
}
