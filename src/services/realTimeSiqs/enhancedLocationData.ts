
/**
 * Enhanced location database with specialized astronomical data
 * This provides detailed information about specific locations to improve
 * the quality of SIQS calculations and user experience
 */

export interface EnhancedLocationData {
  name: string;
  latitude: number;
  longitude: number;
  isDarkSkyReserve?: boolean;
  certification?: string;
  bortleScale?: number;
  clearSkyRate?: number;
  bestMonths?: string[];
  characteristics?: string[];
  annualPrecipitationDays?: number;
  averageVisibility?: string;
  type?: string; // Added type property to the interface
  seasonalTrends?: {
    spring: { clearSkyRate: number, averageTemperature: number };
    summer: { clearSkyRate: number, averageTemperature: number };
    fall: { clearSkyRate: number, averageTemperature: number };
    winter: { clearSkyRate: number, averageTemperature: number };
  };
  specialConsideration?: string;
}

/**
 * Database of enhanced locations with specialized astronomical data
 */
export const enhancedLocations: EnhancedLocationData[] = [
  // International Dark Sky Reserves (IDSR)
  {
    name: "NamibRand Nature Reserve",
    latitude: -24.9374,
    longitude: 15.9830,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Reserve - Gold",
    bortleScale: 1,
    clearSkyRate: 92,
    bestMonths: ["May", "Jun", "Jul", "Aug", "Sep"],
    characteristics: ["Exceptional Milky Way visibility", "Extremely low humidity", "Protected desert environment"],
    annualPrecipitationDays: 18,
    averageVisibility: "excellent",
    seasonalTrends: {
      spring: { clearSkyRate: 85, averageTemperature: 20 },
      summer: { clearSkyRate: 80, averageTemperature: 30 },
      fall: { clearSkyRate: 90, averageTemperature: 22 },
      winter: { clearSkyRate: 95, averageTemperature: 12 }
    },
    specialConsideration: "One of the darkest measured skies on Earth"
  },
  {
    name: "Aoraki Mackenzie (Mt. John)",
    latitude: -43.9872,
    longitude: 170.4652,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Reserve - Gold",
    bortleScale: 2,
    clearSkyRate: 75,
    bestMonths: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
    characteristics: ["Protected lighting ordinances since 1981", "Home of Mt John Observatory", "Exceptional southern sky viewing"],
    annualPrecipitationDays: 76,
    averageVisibility: "excellent",
    seasonalTrends: {
      spring: { clearSkyRate: 70, averageTemperature: 11 },
      summer: { clearSkyRate: 65, averageTemperature: 18 },
      fall: { clearSkyRate: 80, averageTemperature: 10 },
      winter: { clearSkyRate: 85, averageTemperature: 2 }
    }
  },
  {
    name: "Pic du Midi",
    latitude: 42.9361,
    longitude: 0.1432,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Reserve",
    bortleScale: 2,
    clearSkyRate: 70,
    bestMonths: ["Jul", "Aug", "Sep", "Oct"],
    characteristics: ["High mountain observatory (2877m)", "Historical astronomical site", "Stable atmospheric conditions"],
    annualPrecipitationDays: 90,
    averageVisibility: "good",
    seasonalTrends: {
      spring: { clearSkyRate: 65, averageTemperature: 5 },
      summer: { clearSkyRate: 75, averageTemperature: 12 },
      fall: { clearSkyRate: 80, averageTemperature: 7 },
      winter: { clearSkyRate: 60, averageTemperature: -5 }
    },
    specialConsideration: "Weather conditions can change rapidly due to mountain location"
  },
  {
    name: "McDonald Observatory",
    latitude: 30.6715,
    longitude: -104.0227,
    isDarkSkyReserve: false,
    certification: "Dark Sky Site",
    bortleScale: 2,
    clearSkyRate: 88,
    bestMonths: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
    characteristics: ["High desert climate", "Low humidity", "6,800 foot elevation"],
    annualPrecipitationDays: 58,
    averageVisibility: "excellent",
    seasonalTrends: {
      spring: { clearSkyRate: 80, averageTemperature: 16 },
      summer: { clearSkyRate: 75, averageTemperature: 25 },
      fall: { clearSkyRate: 90, averageTemperature: 17 },
      winter: { clearSkyRate: 85, averageTemperature: 8 }
    }
  },
  {
    name: "Alqueva Dark Sky Reserve",
    latitude: 38.2000,
    longitude: -7.4000,
    isDarkSkyReserve: true,
    certification: "Starlight Tourism Destination",
    bortleScale: 2,
    clearSkyRate: 83,
    bestMonths: ["Jun", "Jul", "Aug", "Sep"],
    characteristics: ["First Starlight Tourism Destination in the world", "Mediterranean climate", "Low humidity summers"],
    annualPrecipitationDays: 65,
    averageVisibility: "excellent",
    seasonalTrends: {
      spring: { clearSkyRate: 75, averageTemperature: 17 },
      summer: { clearSkyRate: 95, averageTemperature: 28 },
      fall: { clearSkyRate: 80, averageTemperature: 18 },
      winter: { clearSkyRate: 65, averageTemperature: 10 }
    }
  },
  {
    name: "Paranal Observatory",
    latitude: -24.6275,
    longitude: -70.4044,
    isDarkSkyReserve: false,
    certification: "Professional Observatory",
    bortleScale: 1,
    clearSkyRate: 96,
    bestMonths: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    characteristics: ["Atacama Desert location", "Extremely low humidity", "2,635m elevation"],
    annualPrecipitationDays: 4,
    averageVisibility: "excellent",
    seasonalTrends: {
      spring: { clearSkyRate: 95, averageTemperature: 15 },
      summer: { clearSkyRate: 90, averageTemperature: 20 },
      fall: { clearSkyRate: 98, averageTemperature: 14 },
      winter: { clearSkyRate: 99, averageTemperature: 10 }
    },
    specialConsideration: "One of the world's premier astronomical sites with ESO's Very Large Telescope"
  },
  {
    name: "Mauna Kea",
    latitude: 19.8207,
    longitude: -155.4681,
    isDarkSkyReserve: false,
    certification: "Professional Observatory",
    bortleScale: 1,
    clearSkyRate: 85,
    bestMonths: ["May", "Jun", "Jul", "Aug", "Sep"],
    characteristics: ["4,207m high mountain observatory", "Above tropical inversion layer", "Extremely stable atmosphere"],
    annualPrecipitationDays: 20,
    averageVisibility: "excellent",
    seasonalTrends: {
      spring: { clearSkyRate: 80, averageTemperature: 4 },
      summer: { clearSkyRate: 90, averageTemperature: 8 },
      fall: { clearSkyRate: 85, averageTemperature: 5 },
      winter: { clearSkyRate: 75, averageTemperature: 0 }
    },
    specialConsideration: "Altitude requires acclimatization, weather can change rapidly"
  },
  {
    name: "Kerry Dark Sky Reserve",
    latitude: 51.9501,
    longitude: -10.1667,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Reserve - Gold",
    bortleScale: 2,
    clearSkyRate: 60,
    bestMonths: ["Apr", "May", "Sep"],
    characteristics: ["Atlantic coastal location", "Low light pollution", "Ocean humidity challenges"],
    annualPrecipitationDays: 150,
    averageVisibility: "good",
    seasonalTrends: {
      spring: { clearSkyRate: 65, averageTemperature: 10 },
      summer: { clearSkyRate: 60, averageTemperature: 15 },
      fall: { clearSkyRate: 70, averageTemperature: 12 },
      winter: { clearSkyRate: 50, averageTemperature: 6 }
    }
  },
  {
    name: "Westhavelland International Dark Sky Reserve",
    latitude: 52.7235,
    longitude: 12.3077,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Reserve - Silver",
    bortleScale: 3,
    clearSkyRate: 55,
    bestMonths: ["Jul", "Aug", "Sep"],
    characteristics: ["Germany's darkest area", "Lake and river landscapes", "Near Berlin but protected from light"],
    annualPrecipitationDays: 112,
    averageVisibility: "good",
    seasonalTrends: {
      spring: { clearSkyRate: 50, averageTemperature: 10 },
      summer: { clearSkyRate: 65, averageTemperature: 18 },
      fall: { clearSkyRate: 60, averageTemperature: 9 },
      winter: { clearSkyRate: 45, averageTemperature: 0 }
    }
  },
  {
    name: "Warrumbungle Dark Sky Park",
    latitude: -31.2711,
    longitude: 149.0661,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Park",
    bortleScale: 2,
    clearSkyRate: 78,
    bestMonths: ["May", "Jun", "Jul", "Aug"],
    characteristics: ["Australia's first Dark Sky Park", "Home to Siding Spring Observatory", "Low humidity inland location"],
    annualPrecipitationDays: 70,
    averageVisibility: "excellent",
    seasonalTrends: {
      spring: { clearSkyRate: 75, averageTemperature: 17 },
      summer: { clearSkyRate: 70, averageTemperature: 26 },
      fall: { clearSkyRate: 80, averageTemperature: 18 },
      winter: { clearSkyRate: 85, averageTemperature: 10 }
    }
  },
  {
    name: "Stellarium du Mont-Mégantic",
    latitude: 45.4307,
    longitude: -71.1523,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Reserve",
    bortleScale: 2,
    clearSkyRate: 62,
    bestMonths: ["Jul", "Aug", "Sep"],
    characteristics: ["First International Dark Sky Reserve", "Mountain observatory at 1,111m", "Protected against light pollution by law"],
    annualPrecipitationDays: 130,
    averageVisibility: "good",
    seasonalTrends: {
      spring: { clearSkyRate: 55, averageTemperature: 5 },
      summer: { clearSkyRate: 70, averageTemperature: 17 },
      fall: { clearSkyRate: 65, averageTemperature: 7 },
      winter: { clearSkyRate: 50, averageTemperature: -10 }
    },
    specialConsideration: "Winter conditions can be extreme but provide excellent transparency"
  },
  {
    name: "Zhangbei Astronomy Park",
    latitude: 41.1538,
    longitude: 114.7086,
    isDarkSkyReserve: false,
    certification: "Dark Sky Park",
    bortleScale: 3,
    clearSkyRate: 72,
    bestMonths: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
    characteristics: ["High altitude plateau", "Low humidity", "Growing astronomy destination in China"],
    annualPrecipitationDays: 60,
    averageVisibility: "good",
    seasonalTrends: {
      spring: { clearSkyRate: 65, averageTemperature: 12 },
      summer: { clearSkyRate: 60, averageTemperature: 22 },
      fall: { clearSkyRate: 80, averageTemperature: 10 },
      winter: { clearSkyRate: 85, averageTemperature: -5 }
    }
  },
  {
    name: "Yeongyang Firefly Eco Park",
    latitude: 36.7471,
    longitude: 129.3056,
    isDarkSkyReserve: true,
    certification: "International Dark Sky Park",
    bortleScale: 3,
    clearSkyRate: 65,
    bestMonths: ["Oct", "Nov", "Dec", "Jan", "Feb"],
    characteristics: ["First Dark Sky Park in East Asia", "Cultural astronomy heritage", "Mountains provide weather protection"],
    annualPrecipitationDays: 95,
    averageVisibility: "good",
    seasonalTrends: {
      spring: { clearSkyRate: 60, averageTemperature: 14 },
      summer: { clearSkyRate: 55, averageTemperature: 25 },
      fall: { clearSkyRate: 70, averageTemperature: 15 },
      winter: { clearSkyRate: 75, averageTemperature: 0 }
    }
  },
  {
    name: "Teide Observatory",
    latitude: 28.3004,
    longitude: -16.5103,
    isDarkSkyReserve: false,
    certification: "Professional Observatory",
    bortleScale: 2,
    clearSkyRate: 82,
    bestMonths: ["May", "Jun", "Jul", "Aug", "Sep"],
    characteristics: ["2,390m elevation on Tenerife", "Above cloud layer", "Special atmospheric protection law"],
    annualPrecipitationDays: 30,
    averageVisibility: "excellent",
    seasonalTrends: {
      spring: { clearSkyRate: 80, averageTemperature: 10 },
      summer: { clearSkyRate: 90, averageTemperature: 17 },
      fall: { clearSkyRate: 85, averageTemperature: 12 },
      winter: { clearSkyRate: 75, averageTemperature: 5 }
    },
    specialConsideration: "Often above the clouds with exceptional atmospheric stability"
  },
  {
    name: "Hehuan Mountain",
    latitude: 24.1458,
    longitude: 121.2762,
    isDarkSkyReserve: false,
    certification: "Dark Sky Site",
    bortleScale: 2,
    clearSkyRate: 68,
    bestMonths: ["Oct", "Nov", "Dec", "Jan", "Feb"],
    characteristics: ["3,275m high mountain in Taiwan", "Above cloud layer most nights", "Low light pollution area"],
    annualPrecipitationDays: 90,
    averageVisibility: "good",
    seasonalTrends: {
      spring: { clearSkyRate: 60, averageTemperature: 8 },
      summer: { clearSkyRate: 55, averageTemperature: 15 },
      fall: { clearSkyRate: 75, averageTemperature: 10 },
      winter: { clearSkyRate: 80, averageTemperature: 0 }
    }
  },
  {
    name: "Waiheke Island Dark Sky Park",
    latitude: -36.7859,
    longitude: 175.0393,
    isDarkSkyReserve: false,
    certification: "Dark Sky Community",
    bortleScale: 3,
    clearSkyRate: 70,
    bestMonths: ["Mar", "Apr", "May", "Jun", "Jul"],
    characteristics: ["Island location with coastal climate", "Community-focused light pollution control", "Coastal humidity challenges"],
    annualPrecipitationDays: 120,
    averageVisibility: "good",
    seasonalTrends: {
      spring: { clearSkyRate: 65, averageTemperature: 16 },
      summer: { clearSkyRate: 60, averageTemperature: 23 },
      fall: { clearSkyRate: 75, averageTemperature: 15 },
      winter: { clearSkyRate: 80, averageTemperature: 10 }
    }
  },
  {
    name: "La Palma",
    latitude: 28.7641,
    longitude: -17.8840,
    isDarkSkyReserve: true,
    certification: "Starlight Reserve",
    bortleScale: 1,
    clearSkyRate: 80,
    bestMonths: ["May", "Jun", "Jul", "Aug", "Sep"],
    characteristics: ["Home to many international observatories", "Protected by specific light pollution law", "2,396m peak with exceptional conditions"],
    annualPrecipitationDays: 40,
    averageVisibility: "excellent",
    seasonalTrends: {
      spring: { clearSkyRate: 75, averageTemperature: 14 },
      summer: { clearSkyRate: 90, averageTemperature: 20 },
      fall: { clearSkyRate: 80, averageTemperature: 16 },
      winter: { clearSkyRate: 70, averageTemperature: 10 }
    },
    specialConsideration: "One of the world's premier astronomical sites with exceptional transparency"
  }
];

/**
 * Find the closest enhanced location to a given set of coordinates
 */
export function findClosestEnhancedLocation(latitude: number, longitude: number): EnhancedLocationData | null {
  if (enhancedLocations.length === 0) return null;
  
  let closest: EnhancedLocationData | null = null;
  let closestDistance = Number.MAX_VALUE;
  
  enhancedLocations.forEach(location => {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = (location.latitude - latitude) * Math.PI / 180;
    const dLon = (location.longitude - longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(latitude * Math.PI / 180) * Math.cos(location.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = location;
    }
  });
  
  // Only return if reasonably close (within 200km)
  return closestDistance <= 200 ? closest : null;
}

/**
 * Get enhanced location data by name
 */
export function getEnhancedLocationByName(name: string): EnhancedLocationData | null {
  return enhancedLocations.find(location => 
    location.name.toLowerCase() === name.toLowerCase()
  ) || null;
}

/**
 * Get all certified dark sky locations
 */
export function getAllCertifiedDarkSkyLocations(): EnhancedLocationData[] {
  return enhancedLocations.filter(location => 
    location.isDarkSkyReserve || 
    (location.certification && location.certification.toLowerCase().includes('dark sky'))
  );
}

/**
 * Check if a location is near a certified dark sky site
 */
export function isNearCertifiedDarkSky(latitude: number, longitude: number, maxDistance: number = 100): boolean {
  const closest = findClosestEnhancedLocation(latitude, longitude);
  if (!closest) return false;
  
  // Calculate distance using Haversine formula
  const R = 6371; // Earth radius in km
  const dLat = (closest.latitude - latitude) * Math.PI / 180;
  const dLon = (closest.longitude - longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(latitude * Math.PI / 180) * Math.cos(closest.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance <= maxDistance && (closest.isDarkSkyReserve || 
    (closest.certification && closest.certification.toLowerCase().includes('dark sky')));
}
