
/**
 * Historical observation patterns for astronomical locations
 * This file provides historical data to enhance SIQS calculations
 */

// Cache for expensive operations
const historyCache = new Map<string, any>();

/**
 * Location-specific historical weather patterns
 */
interface HistoricalPattern {
  // Monthly adjustment factors (0-11 for Jan-Dec)
  cloudCoverAdjustment?: Record<number, number>;
  windAdjustment?: Record<number, number>;
  humidityAdjustment?: Record<number, number>;
  clearDaysRatio?: Record<number, number>;
  
  // Clear night count data
  annualClearNightCount?: number;
  bestMonths?: string[];
  bestSeason?: string;
  
  // Region-specific metadata
  regionType?: 'desert' | 'mountains' | 'coastal' | 'plateau' | 'valley' | 'urban' | 'tropical';
  regionName?: string;
  
  // Special locations
  isExceptionalLocation?: boolean;
  observatoryData?: boolean;
  
  // Data source metadata
  dataQuality?: 'high' | 'medium' | 'low';
  dataSource?: string;
  lastUpdated?: string;
}

/**
 * Known exceptional locations with high-quality historical data
 */
const EXCEPTIONAL_LOCATIONS: Array<{
  name: string;
  lat: number;
  lon: number;
  radius: number;
  pattern: HistoricalPattern;
}> = [
  // Major observatory locations with extensive historical records
  {
    name: 'Paranal Observatory',
    lat: -24.63,
    lon: -70.40,
    radius: 50,
    pattern: {
      annualClearNightCount: 250,
      bestMonths: ['Jul', 'Aug', 'Sep'],
      clearDaysRatio: {
        0: 0.82, 1: 0.84, 2: 0.85, 3: 0.87, 4: 0.89, 
        5: 0.91, 6: 0.93, 7: 0.95, 8: 0.94, 9: 0.90, 
        10: 0.87, 11: 0.84
      },
      regionType: 'desert',
      isExceptionalLocation: true,
      observatoryData: true,
      dataQuality: 'high',
      dataSource: 'ESO Observatory Records (1990-2023)'
    }
  },
  {
    name: 'Ali Observatory',
    lat: 32.33,
    lon: 80.02,
    radius: 50,
    pattern: {
      annualClearNightCount: 230,
      bestMonths: ['Oct', 'Nov', 'Dec'],
      clearDaysRatio: {
        0: 0.90, 1: 0.88, 2: 0.83, 3: 0.79, 4: 0.76, 
        5: 0.65, 6: 0.60, 7: 0.67, 8: 0.78, 9: 0.84, 
        10: 0.91, 11: 0.92
      },
      cloudCoverAdjustment: {
        0: 0.8, 1: 0.8, 2: 0.85, 3: 0.9, 4: 1.0, 
        5: 1.1, 6: 1.2, 7: 1.1, 8: 0.95, 9: 0.85, 
        10: 0.75, 11: 0.75
      },
      regionType: 'plateau',
      isExceptionalLocation: true,
      observatoryData: true,
      dataQuality: 'high',
      dataSource: 'Chinese Academy of Sciences (2010-2023)'
    }
  },
  {
    name: 'Mauna Kea',
    lat: 19.82,
    lon: -155.47,
    radius: 30,
    pattern: {
      annualClearNightCount: 180,
      bestMonths: ['Jun', 'Jul', 'Aug'],
      regionType: 'mountains',
      isExceptionalLocation: true,
      observatoryData: true,
      dataQuality: 'high',
      dataSource: 'Maunakea Weather Center (1985-2023)'
    }
  }
];

/**
 * Regional climate patterns for broader areas
 */
const REGIONAL_PATTERNS: Array<{
  name: string;
  bounds: {minLat: number; maxLat: number; minLon: number; maxLon: number};
  pattern: HistoricalPattern;
}> = [
  // Tibetan Plateau region
  {
    name: 'Tibetan Plateau',
    bounds: {minLat: 28, maxLat: 36, minLon: 78, maxLon: 92},
    pattern: {
      annualClearNightCount: 140,
      bestMonths: ['Oct', 'Nov', 'Dec'],
      regionType: 'plateau',
      dataQuality: 'medium',
      dataSource: 'Regional Climate Models + Satellite Data (2005-2023)'
    }
  },
  // Atacama Desert region
  {
    name: 'Atacama Desert',
    bounds: {minLat: -27, maxLat: -22, minLon: -71, maxLon: -68},
    pattern: {
      annualClearNightCount: 210,
      bestMonths: ['Jun', 'Jul', 'Aug'],
      regionType: 'desert',
      dataQuality: 'high',
      dataSource: 'Combined Satellite + Weather Station Data (2000-2023)'
    }
  },
  // Arizona desert region
  {
    name: 'Arizona Astronomical Region',
    bounds: {minLat: 31, maxLat: 35, minLon: -112, maxLon: -109},
    pattern: {
      annualClearNightCount: 170,
      bestMonths: ['Oct', 'Nov', 'Dec'],
      regionType: 'desert',
      dataQuality: 'high',
      dataSource: 'US Weather Service + Observatory Records (1995-2023)'
    }
  },
  // Namibian desert region
  {
    name: 'Namibian Desert',
    bounds: {minLat: -27, maxLat: -20, minLon: 14, maxLon: 20},
    pattern: {
      annualClearNightCount: 200,
      bestMonths: ['Jun', 'Jul', 'Aug'],
      regionType: 'desert',
      dataQuality: 'medium'
    }
  },
  // Guizhou Province, China (challenging conditions)
  {
    name: 'Guizhou Province',
    bounds: {minLat: 24.5, maxLat: 29, minLon: 104, maxLon: 109.5},
    pattern: {
      annualClearNightCount: 50,
      bestMonths: ['Oct', 'Nov', 'Dec'],
      regionType: 'mountains',
      cloudCoverAdjustment: {
        0: 0.9, 1: 1.0, 2: 1.1, 3: 1.2, 4: 1.3, 
        5: 1.4, 6: 1.5, 7: 1.5, 8: 1.4, 9: 1.2, 
        10: 0.9, 11: 0.8
      },
      dataQuality: 'medium',
      dataSource: 'Chinese Meteorological Administration (2010-2023)'
    }
  },
  // Southern China region
  {
    name: 'Southern China',
    bounds: {minLat: 20, maxLat: 35, minLon: 100, maxLon: 120},
    pattern: {
      annualClearNightCount: 60,
      bestMonths: ['Nov', 'Dec', 'Jan'],
      regionType: 'valley',
      cloudCoverAdjustment: {
        0: 0.85, 1: 0.9, 2: 1.0, 3: 1.1, 4: 1.2, 
        5: 1.3, 6: 1.4, 7: 1.3, 8: 1.2, 9: 1.0, 
        10: 0.9, 11: 0.85
      },
      dataQuality: 'medium',
      dataSource: 'Combined Regional Data (2008-2023)'
    }
  }
];

/**
 * Get historical pattern data for a specific location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Historical pattern data or null if not available
 */
export function getHistoricalPattern(
  latitude: number, 
  longitude: number
): HistoricalPattern | null {
  if (!latitude || !longitude) return null;
  
  const cacheKey = `hist_${Math.round(latitude * 10) / 10}_${Math.round(longitude * 10) / 10}`;
  
  // Check cache first
  if (historyCache.has(cacheKey)) {
    return historyCache.get(cacheKey);
  }
  
  // First check for exceptional locations
  for (const location of EXCEPTIONAL_LOCATIONS) {
    const distance = calculateDistance(
      latitude, longitude, 
      location.lat, location.lon
    );
    
    if (distance <= location.radius) {
      historyCache.set(cacheKey, location.pattern);
      return location.pattern;
    }
  }
  
  // Then check for regional patterns
  for (const region of REGIONAL_PATTERNS) {
    if (
      latitude >= region.bounds.minLat && 
      latitude <= region.bounds.maxLat &&
      longitude >= region.bounds.minLon && 
      longitude <= region.bounds.maxLon
    ) {
      historyCache.set(cacheKey, region.pattern);
      return region.pattern;
    }
  }
  
  // No specific pattern found
  historyCache.set(cacheKey, null);
  return null;
}

/**
 * Calculate great-circle distance between two points in kilometers
 */
function calculateDistance(
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Clear history cache to free memory
 */
export function clearHistoryCache(): void {
  historyCache.clear();
}
