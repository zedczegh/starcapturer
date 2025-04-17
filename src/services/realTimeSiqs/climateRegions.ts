
/**
 * Climate regions database for enhanced SIQS calculation
 * This provides specialized data to improve the accuracy of sky quality predictions
 * across different global climate zones
 */

export interface ClimateRegion {
  name: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng?: number;
    maxLng?: number;
  };
  bestMonths: number[];  // 0-11 for Jan-Dec
  avgClearSkyRate: number;
  seasonalFactors: {
    [key: string]: number; // seasonal adjustment factors
  };
  characteristic: string;
}

/**
 * Global climate regions database with specialized astronomical viewing characteristics
 */
export const climateRegions: ClimateRegion[] = [
  {
    name: "Atacama Desert",
    bounds: {
      minLat: -30,
      maxLat: -20,
      minLng: -72,
      maxLng: -68
    },
    bestMonths: [3, 4, 5, 6, 7, 8], // April-September
    avgClearSkyRate: 90,
    seasonalFactors: {
      spring: 1.15,
      summer: 1.05,
      fall: 1.15,
      winter: 1.20
    },
    characteristic: "World's premier astronomical site with exceptional clear sky percentage and minimal atmospheric interference"
  },
  {
    name: "Southwestern USA",
    bounds: {
      minLat: 30,
      maxLat: 40,
      minLng: -120,
      maxLng: -105
    },
    bestMonths: [8, 9, 10, 11, 0, 1], // September-February
    avgClearSkyRate: 80,
    seasonalFactors: {
      spring: 1.05,
      summer: 0.95,
      fall: 1.10,
      winter: 1.10
    },
    characteristic: "Excellent astronomy conditions with dark skies and low humidity, monsoon activity in summer"
  },
  {
    name: "Mediterranean Basin",
    bounds: {
      minLat: 35,
      maxLat: 45,
      minLng: -5,
      maxLng: 30
    },
    bestMonths: [5, 6, 7, 8], // June-September
    avgClearSkyRate: 75,
    seasonalFactors: {
      spring: 1.05,
      summer: 1.15,
      fall: 1.00,
      winter: 0.90
    },
    characteristic: "Excellent summer viewing with stable air masses, winter precipitation impacts visibility"
  },
  {
    name: "Himalayas",
    bounds: {
      minLat: 27,
      maxLat: 35,
      minLng: 75,
      maxLng: 95
    },
    bestMonths: [9, 10, 11, 0, 1], // October-February
    avgClearSkyRate: 70,
    seasonalFactors: {
      spring: 0.95,
      summer: 0.85,
      fall: 1.10,
      winter: 1.15
    },
    characteristic: "Excellent winter viewing at high elevations, monsoon season severely impacts summer observations"
  },
  {
    name: "Australian Outback",
    bounds: {
      minLat: -35,
      maxLat: -20,
      minLng: 120,
      maxLng: 145
    },
    bestMonths: [4, 5, 6, 7, 8], // May-September
    avgClearSkyRate: 85,
    seasonalFactors: {
      spring: 1.00,
      summer: 0.95,
      fall: 1.05,
      winter: 1.15
    },
    characteristic: "Excellent dark skies with minimal light pollution, winter provides most stable viewing conditions"
  },
  {
    name: "Sahara Desert",
    bounds: {
      minLat: 15,
      maxLat: 30,
      minLng: -15,
      maxLng: 35
    },
    bestMonths: [9, 10, 11, 0, 1, 2], // October-March
    avgClearSkyRate: 85,
    seasonalFactors: {
      spring: 1.05,
      summer: 0.90,
      fall: 1.10,
      winter: 1.15
    },
    characteristic: "Exceptional sky transparency, but summer heat can create thermal disturbances"
  },
  {
    name: "Southern Africa",
    bounds: {
      minLat: -35,
      maxLat: -20,
      minLng: 15,
      maxLng: 35
    },
    bestMonths: [4, 5, 6, 7], // May-August
    avgClearSkyRate: 80,
    seasonalFactors: {
      spring: 1.00,
      summer: 0.90,
      fall: 1.05,
      winter: 1.15
    },
    characteristic: "Excellent winter viewing with very dark skies and good transparency, summer brings clouds and storms"
  },
  {
    name: "Northern Scandinavia",
    bounds: {
      minLat: 60,
      maxLat: 71,
      minLng: 5,
      maxLng: 30
    },
    bestMonths: [0, 1, 2, 9, 10, 11], // October-March
    avgClearSkyRate: 50,
    seasonalFactors: {
      spring: 0.95,
      summer: 0.85, // Midnight sun period
      fall: 1.00,
      winter: 1.10
    },
    characteristic: "Long winter nights provide extended viewing, but frequent cloud cover and extreme cold can be challenging"
  },
  {
    name: "High Andes",
    bounds: {
      minLat: -35,
      maxLat: -10,
      minLng: -75,
      maxLng: -65
    },
    bestMonths: [4, 5, 6, 7, 8], // May-September
    avgClearSkyRate: 80,
    seasonalFactors: {
      spring: 1.05,
      summer: 0.90,
      fall: 1.10,
      winter: 1.15
    },
    characteristic: "High elevation provides excellent transparency and minimal atmospheric interference"
  },
  {
    name: "Tibetan Plateau",
    bounds: {
      minLat: 28,
      maxLat: 36,
      minLng: 78,
      maxLng: 95
    },
    bestMonths: [9, 10, 11, 0, 1, 2], // October-March
    avgClearSkyRate: 75,
    seasonalFactors: {
      spring: 1.00,
      summer: 0.85,
      fall: 1.10,
      winter: 1.15
    },
    characteristic: "High-altitude site with excellent transparency, winter provides best viewing with minimal moisture"
  },
  {
    name: "Central Siberia",
    bounds: {
      minLat: 55,
      maxLat: 65,
      minLng: 80,
      maxLng: 120
    },
    bestMonths: [11, 0, 1, 2], // December-March 
    avgClearSkyRate: 60,
    seasonalFactors: {
      spring: 0.95,
      summer: 0.90,
      fall: 1.00,
      winter: 1.10
    },
    characteristic: "Extremely cold winter provides good transparency but challenging observing conditions"
  },
  {
    name: "Central Australia",
    bounds: {
      minLat: -30,
      maxLat: -20,
      minLng: 130,
      maxLng: 140
    },
    bestMonths: [4, 5, 6, 7, 8], // May-September
    avgClearSkyRate: 85,
    seasonalFactors: {
      spring: 1.05,
      summer: 0.95,
      fall: 1.05,
      winter: 1.15
    },
    characteristic: "Dry conditions, minimal light pollution, and excellent seeing make this a premium southern hemisphere location"
  }
];

/**
 * Find the climate region for a given location
 */
export function findClimateRegion(latitude: number, longitude: number): ClimateRegion | null {
  // Normalize longitude to -180 to 180 range
  const normLng = ((longitude + 540) % 360) - 180;
  
  return climateRegions.find(region => {
    const inLatRange = latitude >= region.bounds.minLat && latitude <= region.bounds.maxLat;
    
    // If longitude bounds are specified, check them; otherwise, just use latitude
    if (region.bounds.minLng !== undefined && region.bounds.maxLng !== undefined) {
      return inLatRange && 
             normLng >= region.bounds.minLng && 
             normLng <= region.bounds.maxLng;
    }
    
    return inLatRange;
  }) || null;
}

/**
 * Get current season based on month and hemisphere
 */
export function getCurrentSeason(month: number, isNorthernHemisphere: boolean): 'spring' | 'summer' | 'fall' | 'winter' {
  // Adjust seasons based on hemisphere
  if (isNorthernHemisphere) {
    if (month >= 2 && month <= 4) return 'spring';  // Mar-May
    if (month >= 5 && month <= 7) return 'summer';  // Jun-Aug
    if (month >= 8 && month <= 10) return 'fall';   // Sep-Nov
    return 'winter';                               // Dec-Feb
  } else {
    if (month >= 2 && month <= 4) return 'fall';    // Mar-May
    if (month >= 5 && month <= 7) return 'winter';  // Jun-Aug
    if (month >= 8 && month <= 10) return 'spring'; // Sep-Nov
    return 'summer';                              // Dec-Feb
  }
}

/**
 * Calculate climate-specific adjustment factor for SIQS
 */
export function getClimateAdjustmentFactor(
  latitude: number, 
  longitude: number, 
  month: number
): number {
  const region = findClimateRegion(latitude, longitude);
  if (!region) return 1.0; // No adjustment if no specific region
  
  // Get current season
  const isNorthernHemisphere = latitude >= 0;
  const season = getCurrentSeason(month, isNorthernHemisphere);
  
  // Check if current month is among best months
  const isOptimalMonth = region.bestMonths.includes(month);
  
  // Base adjustment from regional seasonal factors
  let factor = region.seasonalFactors[season] || 1.0;
  
  // Additional boost if this is one of the best months for this region
  if (isOptimalMonth) {
    factor *= 1.05;
  }
  
  return factor;
}

/**
 * Get detailed climate information for a location
 */
export function getLocationClimateInfo(latitude: number, longitude: number): {
  region: string | null;
  bestMonths: string[];
  clearSkyRate: number | null;
  characteristic: string | null;
} {
  const region = findClimateRegion(latitude, longitude);
  
  if (!region) {
    return {
      region: null,
      bestMonths: [],
      clearSkyRate: null,
      characteristic: null
    };
  }
  
  // Convert month numbers to names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const bestMonths = region.bestMonths.map(m => monthNames[m]);
  
  return {
    region: region.name,
    bestMonths,
    clearSkyRate: region.avgClearSkyRate,
    characteristic: region.characteristic
  };
}
