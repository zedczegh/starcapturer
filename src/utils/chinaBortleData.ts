/**
 * China-specific Bortle scale data and utilities
 * This module contains specialized data and functions for Chinese cities and regions
 */

// Define interface for Chinese location data
interface ChineseLocationData {
  name: string;
  englishName?: string;
  province?: string;
  coordinates: [number, number]; // [latitude, longitude]
  bortleScale: number;
  population?: number;
  notes?: string;
}

// Sample Chinese cities data with Bortle scale values
const chineseCities: ChineseLocationData[] = [
  {
    name: "北京",
    englishName: "Beijing",
    province: "Beijing",
    coordinates: [39.9042, 116.4074],
    bortleScale: 9,
    population: 21540000,
    notes: "Severe light pollution in capital city"
  },
  {
    name: "上海",
    englishName: "Shanghai",
    province: "Shanghai",
    coordinates: [31.2304, 121.4737],
    bortleScale: 9,
    population: 24280000,
    notes: "Heavy light pollution in financial center"
  },
  {
    name: "香港",
    englishName: "Hong Kong",
    province: "Hong Kong SAR",
    coordinates: [22.3193, 114.1694],
    bortleScale: 8.5,
    population: 7490000,
    notes: "Dense urban area with significant light pollution"
  },
  {
    name: "拉萨",
    englishName: "Lhasa",
    province: "Tibet",
    coordinates: [29.6500, 91.1000],
    bortleScale: 4,
    population: 559000,
    notes: "High elevation, lower population density"
  },
  {
    name: "乌鲁木齐",
    englishName: "Urumqi",
    province: "Xinjiang",
    coordinates: [43.8250, 87.6000],
    bortleScale: 7,
    population: 3550000,
    notes: "Western China, moderate light pollution"
  }
];

// Sample Chinese mountain regions with Bortle scale values
const chineseMountains: ChineseLocationData[] = [
  {
    name: "黄山",
    englishName: "Mount Huangshan",
    province: "Anhui",
    coordinates: [30.1300, 118.1650],
    bortleScale: 3,
    notes: "UNESCO World Heritage site, good stargazing"
  },
  {
    name: "泰山",
    englishName: "Mount Tai",
    province: "Shandong",
    coordinates: [36.2500, 117.1000],
    bortleScale: 4,
    notes: "Historic sacred mountain, moderate light pollution"
  },
  {
    name: "武夷山",
    englishName: "Mount Wuyi",
    province: "Fujian",
    coordinates: [27.7167, 118.0333],
    bortleScale: 3,
    notes: "Remote location with good skies"
  }
];

/**
 * Check if coordinates are within China's general boundaries
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns true if coordinates are likely in China
 */
export function isInChina(latitude: number, longitude: number): boolean {
  // Rough boundaries for mainland China, Hong Kong, Macau, and Taiwan
  return (
    latitude >= 18 && latitude <= 54 &&
    longitude >= 73 && longitude <= 135
  );
}

/**
 * Get the Bortle scale value for a specific city in China
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Bortle scale if known, null otherwise
 */
export function getCityBortleScale(latitude: number, longitude: number): number | null {
  // If not in China, return null
  if (!isInChina(latitude, longitude)) {
    return null;
  }

  // Check city database
  const closestCity = findClosestChineseLocation(latitude, longitude, chineseCities);
  
  // If we found a match within 25km, use its Bortle scale
  if (closestCity && closestCity.distance < 25) {
    // Fix: access bortleScale from the location property
    return closestCity.location.bortleScale;
  }

  // Check mountain database
  const closestMountain = findClosestChineseLocation(latitude, longitude, chineseMountains);
  
  // If we found a mountain within 20km, use its Bortle scale
  if (closestMountain && closestMountain.distance < 20) {
    // Fix: access bortleScale from the location property
    return closestMountain.location.bortleScale;
  }

  return null;
}

/**
 * Find the closest location in the database
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param locations Array of location data
 * @returns The closest location with distance
 */
function findClosestChineseLocation(
  latitude: number,
  longitude: number,
  locations: ChineseLocationData[]
): { location: ChineseLocationData; distance: number } | null {
  if (!locations || locations.length === 0) {
    return null;
  }

  let closestLocation: ChineseLocationData | null = null;
  let minDistance = Infinity;

  for (const location of locations) {
    const distance = calculateDistance(
      latitude,
      longitude,
      location.coordinates[0],
      location.coordinates[1]
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestLocation = location;
    }
  }

  if (!closestLocation) {
    return null;
  }

  return {
    location: closestLocation,
    distance: minDistance,
  };
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Get additional information about a Chinese location
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Location information if found
 */
export function getChineseLocationInfo(
  latitude: number,
  longitude: number
): {
  name: string;
  englishName?: string;
  province?: string;
  bortleScale: number;
  population?: number;
  notes?: string;
} | null {
  // Check if coordinates are in China
  if (!isInChina(latitude, longitude)) {
    return null;
  }

  // Check city database
  const closestCity = findClosestChineseLocation(latitude, longitude, chineseCities);
  if (closestCity && closestCity.distance < 25) {
    const { location } = closestCity;
    return {
      name: location.name,
      englishName: location.englishName,
      province: location.province,
      bortleScale: location.bortleScale,
      population: location.population,
      notes: location.notes
    };
  }

  // Check mountain database
  const closestMountain = findClosestChineseLocation(latitude, longitude, chineseMountains);
  if (closestMountain && closestMountain.distance < 20) {
    const { location } = closestMountain;
    return {
      name: location.name,
      englishName: location.englishName,
      province: location.province,
      bortleScale: location.bortleScale,
      notes: location.notes
    };
  }

  return null;
}

/**
 * Get region information for a Chinese location by its coordinates
 */
export function getChineseRegion(
  latitude: number, 
  longitude: number
): {
  province: string;
  region: string;
  urbanDensity: string;
} | null {
  // Check if coordinates are in China
  if (!isInChina(latitude, longitude)) {
    return null;
  }

  // Check city database first
  const closestCity = findClosestChineseLocation(latitude, longitude, chineseCities);
  
  if (closestCity && closestCity.distance < 50) {
    const city = closestCity.location;
    
    // Determine urban density based on Bortle scale or population
    let urbanDensity = "Unknown";
    
    if (city.population) {
      if (city.population > 10000000) urbanDensity = "Mega-city";
      else if (city.population > 5000000) urbanDensity = "Very large city";
      else if (city.population > 1000000) urbanDensity = "Large city";
      else if (city.population > 500000) urbanDensity = "Medium city";
      else if (city.population > 100000) urbanDensity = "Small city";
      else urbanDensity = "Town";
    } else if (city.bortleScale) {
      if (city.bortleScale >= 8) urbanDensity = "Heavy urban";
      else if (city.bortleScale >= 6) urbanDensity = "Urban";
      else if (city.bortleScale >= 5) urbanDensity = "Suburban";
      else urbanDensity = "Rural area";
    }
    
    return {
      province: city.province || "Unknown province",
      region: city.name,
      urbanDensity
    };
  }
  
  // Default region classification based on coordinates
  // This is a very simplified approach
  let province = "Unknown province";
  
  if (latitude > 40) province = "Northern China";
  else if (latitude > 30) province = "Central China";
  else province = "Southern China";
  
  if (longitude < 100) province = "Western " + province;
  else if (longitude > 115) province = "Eastern " + province;
  
  return {
    province,
    region: "Unclassified region",
    urbanDensity: "Unknown"
  };
}
