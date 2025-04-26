
import { fetchClearSkyRate as fetchClearSkyRateFromApi } from './apiUtils';
import { clearClearSkyRateCache as clearCache } from './cacheUtils';
import { clearSkyDataCollector } from '@/services/clearSky/clearSkyDataCollector';

const CLEAR_SKY_RATE_API_URL = process.env.NEXT_PUBLIC_CLEAR_SKY_RATE_API_URL;

/**
 * Clear cache for clear sky rate data
 */
export function clearClearSkyRateCache(latitude?: number, longitude?: number): void {
  if (latitude !== undefined && longitude !== undefined) {
    const cacheKey = `clear-sky-${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
    clearCache(cacheKey);
    return;
  }
  
  clearCache('clear-sky');
}

/**
 * Fetch clear sky rate data from cache or API
 */
async function fetchClearSkyRateFromCache(
  latitude: number, 
  longitude: number,
  includeHistorical: boolean = true
): Promise<{
  annualRate: number;
  monthlyRates: Record<string, number>;
  clearestMonths: string[];
  confidence: number;
  dataSource: string;
}> {
  const cacheKey = `clear-sky-${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
  
  try {
    // Check if data exists in local storage
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      
      // Validate the structure of the cached data
      if (
        typeof parsedData === 'object' &&
        parsedData !== null &&
        typeof parsedData.annualRate === 'number' &&
        typeof parsedData.monthlyRates === 'object' &&
        parsedData.monthlyRates !== null &&
        Array.isArray(parsedData.clearestMonths)
      ) {
        console.log(`Using cached clear sky rate data for ${latitude}, ${longitude}`);
        return {
          annualRate: parsedData.annualRate,
          monthlyRates: parsedData.monthlyRates,
          clearestMonths: parsedData.clearestMonths,
          confidence: 0.8,
          dataSource: 'Cache'
        };
      } else {
        console.warn('Invalid cached data, fetching from API');
        localStorage.removeItem(cacheKey);
      }
    }
    
    // If not in cache or cache is invalid, fetch from API
    return await fetchClearSkyRateFromApi(latitude, longitude, includeHistorical);
  } catch (error) {
    console.error("Error fetching clear sky rate from cache:", error);
    throw error;
  }
}

/**
 * Enhanced fetch clear sky rate with integrated local observations
 * This provides a more accurate clear sky rate by combining API data with local observations
 */
export async function fetchClearSkyRate(
  latitude: number, 
  longitude: number, 
  includeHistorical: boolean = true
): Promise<{
  annualRate: number;
  monthlyRates: Record<string, number>;
  clearestMonths: string[];
  confidence: number;
  dataSource: string;
}> {
  // First check if we have local observations with good confidence
  try {
    const localData = clearSkyDataCollector.calculateClearSkyRate(latitude, longitude, 20);
    
    if (localData && localData.confidence > 0.7 && localData.rate > 0) {
      console.log(`Using local observation data for clear sky rate: ${localData.rate}%`);
      
      // We have high confidence local data, use it as our primary source
      // But we'll still fetch API data to fill in monthly rates
      const apiData = await fetchClearSkyRateFromApi(latitude, longitude, includeHistorical)
        .catch(() => null);
      
      if (apiData) {
        // Blend the local rate with API data for the annual rate
        return {
          annualRate: Math.round(localData.rate * 0.7 + apiData.annualRate * 0.3),
          monthlyRates: apiData.monthlyRates,
          clearestMonths: apiData.clearestMonths,
          confidence: localData.confidence,
          dataSource: 'Combined local observations and API data'
        };
      }
      
      // If API fetch failed, generate synthetic monthly data from the annual rate
      return {
        annualRate: localData.rate,
        monthlyRates: generateSyntheticMonthlyRates(localData.rate, latitude),
        clearestMonths: generateClearestMonths(latitude),
        confidence: localData.confidence,
        dataSource: 'Local observations'
      };
    }
  } catch (error) {
    console.warn("Error calculating local clear sky rate:", error);
  }
  
  // Fall back to API or cache data
  return fetchClearSkyRateFromCache(latitude, longitude, includeHistorical);
}

/**
 * Generate synthetic monthly rates based on annual rate and latitude
 */
function generateSyntheticMonthlyRates(annualRate: number, latitude: number): Record<string, number> {
  const isNorthern = latitude >= 0;
  const variance = Math.min(30, annualRate * 0.3); // Max 30% variance
  
  // Define seasonal patterns based on hemisphere
  const seasonalAdjustments = isNorthern 
    ? { // Northern hemisphere
        'Jan': -0.2, 'Feb': -0.15, 'Mar': -0.05, 'Apr': 0.05, 
        'May': 0.1, 'Jun': 0.2, 'Jul': 0.2, 'Aug': 0.15, 
        'Sep': 0.1, 'Oct': 0, 'Nov': -0.1, 'Dec': -0.2
      }
    : { // Southern hemisphere
        'Jan': 0.2, 'Feb': 0.15, 'Mar': 0.05, 'Apr': -0.05, 
        'May': -0.1, 'Jun': -0.2, 'Jul': -0.2, 'Aug': -0.15, 
        'Sep': -0.1, 'Oct': 0, 'Nov': 0.1, 'Dec': 0.2
      };
  
  const result: Record<string, number> = {};
  
  Object.entries(seasonalAdjustments).forEach(([month, adjustment]) => {
    result[month] = Math.round(Math.min(100, Math.max(0, annualRate + (variance * adjustment))));
  });
  
  return result;
}

/**
 * Generate typical clearest months based on latitude
 */
function generateClearestMonths(latitude: number): string[] {
  const isNorthern = latitude >= 0;
  
  return isNorthern 
    ? ['Jun', 'Jul', 'Aug'] // Northern hemisphere summer
    : ['Dec', 'Jan', 'Feb']; // Southern hemisphere summer
}
