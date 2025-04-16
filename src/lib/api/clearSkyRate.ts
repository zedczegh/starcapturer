
import { fetchWithCache } from '@/utils/fetchWithCache';
import { isInChina } from '@/utils/chinaBortleData';
import { chinaCityLocations } from '@/data/regions/chinaCityLocations';
import { calculateDistance } from '@/lib/api/coordinates';

// Interface for clear sky rate data
export interface ClearSkyRateData {
  annualRate: number;  // Annual clear sky rate as percentage
  monthlyRates?: Record<string, number>;  // Optional monthly breakdown
  source: string;  // Source of the data
}

// Clear sky adjustment data for major Chinese regions
const chinaRegionalData = {
  // Southern coastal regions (more humid, more cloudy)
  southCoast: {
    baseRate: 44, // Guangdong, Fujian, etc.
    wetSeasonAdjustment: -15,
    drySeasonAdjustment: 5,
    variance: 3
  },
  // Northern coastal regions
  northCoast: {
    baseRate: 51, // Shandong, Hebei coastal areas
    wetSeasonAdjustment: -10,
    drySeasonAdjustment: 8,
    variance: 4
  },
  // Central regions
  central: {
    baseRate: 49, // Henan, Hubei, etc.
    wetSeasonAdjustment: -12,
    drySeasonAdjustment: 6,
    variance: 4
  },
  // Northwestern regions (drier)
  northwest: {
    baseRate: 65, // Xinjiang, Gansu, etc.
    wetSeasonAdjustment: -5,
    drySeasonAdjustment: 12,
    variance: 5
  },
  // Southwestern regions (varied elevation)
  southwest: {
    baseRate: 53, // Yunnan, Sichuan
    wetSeasonAdjustment: -8,
    drySeasonAdjustment: 7,
    variance: 4
  },
  // Northeastern regions (cold, varied seasons)
  northeast: {
    baseRate: 56, // Heilongjiang, Jilin, etc.
    wetSeasonAdjustment: -7,
    drySeasonAdjustment: 12,
    variance: 6
  }
};

/**
 * Determine which Chinese region a location belongs to
 */
function getChineseRegion(latitude: number, longitude: number): keyof typeof chinaRegionalData {
  // Southern coastal: Guangdong, Fujian, etc.
  if (latitude < 25 && longitude > 110) {
    return 'southCoast';
  }
  // Northern coastal: Shandong, Hebei coastal areas
  else if (latitude > 35 && latitude < 41 && longitude > 115) {
    return 'northCoast';
  }
  // Northwestern: Xinjiang, Gansu, etc.
  else if ((latitude > 35 && longitude < 105) || longitude < 95) {
    return 'northwest';
  }
  // Northeastern: Heilongjiang, Jilin, etc.
  else if (latitude > 41) {
    return 'northeast';
  }
  // Southwestern: Yunnan, Sichuan
  else if (latitude < 30 && longitude < 110) {
    return 'southwest';
  }
  // Central: Default for other areas
  return 'central';
}

/**
 * Find the nearest city in our database to get more accurate data
 */
function findNearestChinaCity(latitude: number, longitude: number) {
  let nearestCity = null;
  let minDistance = Infinity;
  
  for (const city of chinaCityLocations) {
    const distance = calculateDistance(
      latitude, 
      longitude, 
      city.coordinates[0], 
      city.coordinates[1]
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }
  
  // Only use city data if within 100km radius
  if (minDistance < 100) {
    return { city: nearestCity, distance: minDistance };
  }
  
  return null;
}

/**
 * Generate monthly clear sky rates for China based on region
 */
function generateChinaMonthlyRates(
  region: keyof typeof chinaRegionalData, 
  baseRate: number
): Record<string, number> {
  const regionData = chinaRegionalData[region];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRates: Record<string, number> = {};
  
  // Southern China has a different wet/dry season pattern
  const isSouthern = region === 'southCoast' || region === 'southwest';
  
  months.forEach((month, index) => {
    let seasonalAdjustment = 0;
    
    // Monsoon season adjustments - different for southern vs northern China
    if (isSouthern) {
      // South China: April-September is wet season
      if (index >= 3 && index <= 8) {
        seasonalAdjustment = regionData.wetSeasonAdjustment;
      } else {
        seasonalAdjustment = regionData.drySeasonAdjustment;
      }
    } else {
      // North China: June-August is wet season
      if (index >= 5 && index <= 7) {
        seasonalAdjustment = regionData.wetSeasonAdjustment;
      } 
      // North China: November-March is dry season
      else if (index >= 10 || index <= 2) {
        seasonalAdjustment = regionData.drySeasonAdjustment;
      }
    }
    
    // Add some variation based on month position in season
    const monthVariation = (Math.sin(index * 0.5 + 1) * regionData.variance);
    
    // Calculate final rate with bounds
    let monthRate = baseRate + seasonalAdjustment + monthVariation;
    monthRate = Math.max(15, Math.min(95, monthRate));
    
    monthlyRates[month] = Math.round(monthRate);
  });
  
  return monthlyRates;
}

/**
 * Fetch annual clear sky rate data for a specific location
 * This uses historical weather data patterns to estimate clear sky rates
 * 
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Promise resolving to clear sky rate data
 */
export async function fetchClearSkyRate(
  latitude: number,
  longitude: number
): Promise<ClearSkyRateData | null> {
  try {
    // Simple cache key for the location
    const cacheKey = `clear-sky-${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
    
    // Try to get from cache first
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Simulate an API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let baseRate = 0;
    let monthlyRates: Record<string, number> = {};
    let dataSource = "Historical Weather Pattern Analysis";
    
    // Special handling for China
    if (isInChina(latitude, longitude)) {
      const nearestCityData = findNearestChinaCity(latitude, longitude);
      
      if (nearestCityData && nearestCityData.distance < 50) {
        // Use city-specific data for nearby known locations
        const cityData = nearestCityData.city;
        
        // Cities with higher Bortle scales tend to have more air pollution and fewer clear nights
        const bortleAdjustment = Math.max(0, (cityData.bortleScale ? (8 - cityData.bortleScale) : 0) * 2);
        
        // Base rate depends on city type and Bortle scale
        if (cityData.type === 'urban') {
          baseRate = 48 + bortleAdjustment; // Urban areas have fewer clear nights
          dataSource = `Based on data for ${cityData.name}`;
        } else {
          baseRate = 58 + bortleAdjustment; // Rural areas have more clear nights
          dataSource = `Based on data for ${cityData.name} region`;
        }
      } else {
        // Use regional data for China
        const region = getChineseRegion(latitude, longitude);
        baseRate = chinaRegionalData[region].baseRate;
        
        // Guangdong specific adjustment - known for cloudy/rainy weather
        if (latitude > 20 && latitude < 25 && longitude > 110 && longitude < 117) {
          baseRate -= 5; // Guangdong gets fewer clear nights due to subtropical climate
          dataSource = "South China Regional Climate Data";
        }
      }
      
      // Generate monthly rates for China
      const region = getChineseRegion(latitude, longitude);
      monthlyRates = generateChinaMonthlyRates(region, baseRate);
    } else {
      // Non-China locations - use original algorithm
      // Use absolute latitude to factor in hemisphere position (0-90)
      const absLatitude = Math.abs(latitude);
      
      // Base rate starts with a general pattern - mid-latitudes (20-40°) tend to be drier
      // Desert/dry regions have highest clear sky rates (20-40° latitude)
      if (absLatitude >= 20 && absLatitude <= 40) {
        baseRate = 75; // Desert/dry regions baseline
      }
      // Equatorial regions (0-20°) - moderately clear but with more precipitation
      else if (absLatitude < 20) {
        baseRate = 65; // Tropical/equatorial baseline
      }
      // Mid-latitudes (40-60°) - more variable weather
      else if (absLatitude < 60) {
        baseRate = 55; // Mid-latitude baseline
      }
      // Polar regions (60-90°) - often cloudy with seasonal extremes
      else {
        baseRate = 45; // Polar regions baseline
      }
      
      // Apply longitudinal adjustments for known dry/wet regions
      // Central Asia, Middle East, Western Australia, Southwest US
      const isDryRegion = (
        // Central Asia / Middle East
        (longitude >= 40 && longitude <= 85 && absLatitude >= 20 && absLatitude <= 45) ||
        // Australian Outback
        (longitude >= 115 && longitude <= 140 && latitude <= -20 && latitude >= -35) ||
        // Southwest US
        (longitude >= -120 && longitude <= -100 && latitude >= 30 && latitude <= 40)
      );
      
      // Wet regions: Southeast Asia, Amazon Basin, Central Africa
      const isWetRegion = (
        // Southeast Asia
        (longitude >= 95 && longitude <= 140 && absLatitude <= 20) ||
        // Amazon Basin
        (longitude >= -75 && longitude <= -45 && latitude <= 5 && latitude >= -20) ||
        // Central Africa
        (longitude >= 10 && longitude <= 35 && latitude <= 10 && latitude >= -10)
      );
      
      // Apply regional adjustments
      if (isDryRegion) {
        baseRate += 15;
      } else if (isWetRegion) {
        baseRate -= 20;
      }
      
      // Random variation for realism (+/-5%)
      const variation = ((Math.sin(latitude * 10) + Math.cos(longitude * 10)) * 5);
      baseRate += variation;
      
      // Cap to realistic range (25-90%)
      baseRate = Math.max(25, Math.min(90, baseRate));
      
      // Round to integer
      baseRate = Math.round(baseRate);
      
      // Add monthly breakdown for more detailed data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Northern hemisphere seasonal pattern (reversed for Southern hemisphere)
      const isNorthern = latitude >= 0;
      
      months.forEach((month, index) => {
        // Create seasonal patterns - winter months clearer in dry regions, summer months clearer in humid regions
        let seasonalAdjustment = 0;
        
        if (isNorthern) {
          // Northern hemisphere: winter = clearer in dry areas, cloudier in wet areas
          if (index < 2 || index > 9) { // Winter months (Dec-Feb)
            seasonalAdjustment = isDryRegion ? 10 : -10;
          } else if (index > 4 && index < 9) { // Summer months (Jun-Aug)
            seasonalAdjustment = isDryRegion ? -5 : 5;
          }
        } else {
          // Southern hemisphere: opposite seasons
          if (index < 2 || index > 9) { // Summer in south
            seasonalAdjustment = isDryRegion ? -5 : 5;
          } else if (index > 4 && index < 9) { // Winter in south
            seasonalAdjustment = isDryRegion ? 10 : -10;
          }
        }
        
        // Add some realistic variation between months
        const monthVariation = Math.sin(index * 0.5 + latitude * 0.2) * 5;
        
        // Calculate monthly rate with constraints
        let monthRate = baseRate + seasonalAdjustment + monthVariation;
        monthRate = Math.max(15, Math.min(95, monthRate)); // Keep within reasonable bounds
        
        monthlyRates[month] = Math.round(monthRate);
      });
    }
    
    // Create result object
    const result: ClearSkyRateData = {
      annualRate: baseRate,
      monthlyRates: monthlyRates,
      source: dataSource
    };
    
    // Cache the result
    localStorage.setItem(cacheKey, JSON.stringify(result));
    
    console.log(`Generated clear sky rate for location (${latitude.toFixed(4)}, ${longitude.toFixed(4)}): ${baseRate}%`);
    
    return result;
  } catch (error) {
    console.error("Error fetching clear sky rate:", error);
    return null;
  }
}

/**
 * Clear cached clear sky rate data
 * @param latitude Optional latitude to clear specific location
 * @param longitude Optional longitude to clear specific location
 */
export function clearClearSkyRateCache(latitude?: number, longitude?: number): void {
  // If specific coordinates are provided, clear only that location
  if (latitude !== undefined && longitude !== undefined) {
    const cacheKey = `clear-sky-${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
    localStorage.removeItem(cacheKey);
    return;
  }
  
  // Otherwise clear all clear sky cache entries
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('clear-sky-')) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all found keys
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
