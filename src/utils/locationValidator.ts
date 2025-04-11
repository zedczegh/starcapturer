/**
 * Utilities for validating and filtering location data
 * Includes detection of water bodies and other unusable locations
 */

// Ocean coordinates boundaries (approximate)
const OCEAN_REGIONS = [
  // Pacific Ocean
  { minLat: -60, maxLat: 65, minLng: -180, maxLng: -115, name: "Pacific Ocean" },
  { minLat: -60, maxLat: 65, minLng: 115, maxLng: 180, name: "Pacific Ocean" },
  
  // Atlantic Ocean
  { minLat: -60, maxLat: 65, minLng: -90, maxLng: -15, name: "Atlantic Ocean" },
  
  // Indian Ocean
  { minLat: -60, maxLat: 30, minLng: 30, maxLng: 115, name: "Indian Ocean" },
  
  // Arctic Ocean
  { minLat: 65, maxLat: 90, minLng: -180, maxLng: 180, name: "Arctic Ocean" },
  
  // Southern Ocean
  { minLat: -90, maxLat: -60, minLng: -180, maxLng: 180, name: "Southern Ocean" },
];

// Major lakes and inland seas
const MAJOR_LAKES = [
  // Caspian Sea
  { minLat: 36, maxLat: 47, minLng: 46, maxLng: 55, name: "Caspian Sea" },
  
  // Great Lakes
  { minLat: 41, maxLat: 49, minLng: -93, maxLng: -76, name: "Great Lakes" },
  
  // Lake Baikal
  { minLat: 51, maxLat: 56, minLng: 103, maxLng: 110, name: "Lake Baikal" },
  
  // Lake Victoria
  { minLat: -3, maxLat: 1, minLng: 31, maxLng: 35, name: "Lake Victoria" },
  
  // Lake Tanganyika
  { minLat: -9, maxLat: -3, minLng: 29, maxLng: 32, name: "Lake Tanganyika" },
  
  // Mediterranean Sea
  { minLat: 30, maxLat: 46, minLng: -6, maxLng: 36, name: "Mediterranean Sea" },
  
  // Black Sea
  { minLat: 40, maxLat: 48, minLng: 27, maxLng: 42, name: "Black Sea" },
  
  // Red Sea
  { minLat: 12, maxLat: 30, minLng: 32, maxLng: 44, name: "Red Sea" },
  
  // Persian Gulf
  { minLat: 23, maxLat: 31, minLng: 47, maxLng: 57, name: "Persian Gulf" },
  
  // Caribbean Sea
  { minLat: 9, maxLat: 25, minLng: -89, maxLng: -59, name: "Caribbean Sea" },
  
  // Bay of Bengal
  { minLat: 5, maxLat: 22, minLng: 80, maxLng: 100, name: "Bay of Bengal" },
  
  // South China Sea
  { minLat: 0, maxLat: 25, minLng: 100, maxLng: 125, name: "South China Sea" },
  
  // East China Sea
  { minLat: 25, maxLat: 35, minLng: 118, maxLng: 130, name: "East China Sea" },
  
  // Sea of Japan
  { minLat: 33, maxLat: 48, minLng: 127, maxLng: 142, name: "Sea of Japan" },
  
  // Philippine Sea
  { minLat: 5, maxLat: 30, minLng: 125, maxLng: 145, name: "Philippine Sea" },
  
  // Hudson Bay
  { minLat: 50, maxLat: 65, minLng: -96, maxLng: -75, name: "Hudson Bay" },
  
  // Gulf of Mexico
  { minLat: 18, maxLat: 31, minLng: -98, maxLng: -80, name: "Gulf of Mexico" },
  
  // Yellow Sea
  { minLat: 32, maxLat: 41, minLng: 118, maxLng: 127, name: "Yellow Sea" },
  
  // Additional water bodies to filter out completely
  
  // Baltic Sea
  { minLat: 53, maxLat: 66, minLng: 10, maxLng: 30, name: "Baltic Sea" },
  
  // North Sea
  { minLat: 51, maxLat: 62, minLng: -4, maxLng: 9, name: "North Sea" },
  
  // Sea of Okhotsk
  { minLat: 44, maxLat: 62, minLng: 135, maxLng: 156, name: "Sea of Okhotsk" },
  
  // Bering Sea
  { minLat: 52, maxLat: 66, minLng: 162, maxLng: -157, name: "Bering Sea" },
  
  // Arabian Sea
  { minLat: 5, maxLat: 23, minLng: 50, maxLng: 78, name: "Arabian Sea" },
  
  // Gulf of Alaska
  { minLat: 55, maxLat: 62, minLng: -155, maxLng: -130, name: "Gulf of Alaska" },
  
  // Barents Sea
  { minLat: 68, maxLat: 80, minLng: 20, maxLng: 60, name: "Barents Sea" },
  
  // Celebes Sea
  { minLat: 0, maxLat: 8, minLng: 118, maxLng: 125, name: "Celebes Sea" },
  
  // Great lakes of North America (combined for broader coverage)
  { minLat: 41, maxLat: 49, minLng: -93, maxLng: -76, name: "Great Lakes Region" },
  
  // Great Salt Lake
  { minLat: 40.7, maxLat: 41.7, minLng: -113.1, maxLng: -112.0, name: "Great Salt Lake" },
  
  // Additional major lakes and small seas for enhanced detection
  { minLat: -12, maxLat: -5, minLng: 12, maxLng: 18, name: "Lake Malawi" },
  { minLat: 28, maxLat: 30, minLng: 32, maxLng: 34, name: "Lake Nasser" },
  { minLat: 45, maxLat: 48, minLng: 86, maxLng: 88, name: "Lake Balkhash" },
  { minLat: 38, maxLat: 42, minLng: 66, maxLng: 70, name: "Aral Sea (remains)" },
  { minLat: 52, maxLat: 56, minLng: 48, maxLng: 55, name: "Kuybyshev Reservoir" },
  
  // Additional coastal regions commonly misidentified
  { minLat: 30.5, maxLat: 31.5, minLng: 121.0, maxLng: 122.0, name: "Shanghai Bay Region" },
  { minLat: 22.0, maxLat: 22.6, minLng: 113.8, maxLng: 114.5, name: "Hong Kong Harbor" },
  { minLat: 37.7, maxLat: 38.0, minLng: -122.6, maxLng: -122.2, name: "San Francisco Bay" },
  { minLat: 40.6, maxLat: 40.9, minLng: -74.1, maxLng: -73.7, name: "New York Bay" },
  { minLat: 31.0, maxLat: 31.4, minLng: 120.0, maxLng: 120.3, name: "Taihu Lake" },
  { minLat: 35.5, maxLat: 35.8, minLng: 139.6, maxLng: 140.1, name: "Tokyo Bay" }
];

// Cache for water location detection to improve performance
const waterLocationCache = new Map<string, boolean>();
const CACHE_SIZE_LIMIT = 1000;

/**
 * Check if a location is on water
 * Uses coordinate-based detection for oceans, seas, and major lakes
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param isCertifiedLocation Whether location is certified dark sky location
 * @returns boolean indicating if location is on water
 */
export function isWaterLocation(latitude: number, longitude: number, isCertifiedLocation: boolean = false): boolean {
  // Never filter out certified dark sky locations
  if (isCertifiedLocation) {
    return false;
  }
  
  // Create cache key based on rounded coordinates (0.1 degree precision)
  const roundedLat = Math.round(latitude * 10) / 10;
  const roundedLng = Math.round(longitude * 10) / 10;
  const cacheKey = `${roundedLat},${roundedLng}`;
  
  // Check cache first for better performance
  if (waterLocationCache.has(cacheKey)) {
    return waterLocationCache.get(cacheKey) || false;
  }
  
  // Manage cache size
  if (waterLocationCache.size > CACHE_SIZE_LIMIT) {
    // Clear the oldest 20% of entries when limit is reached
    const keys = Array.from(waterLocationCache.keys());
    const deleteCount = Math.floor(CACHE_SIZE_LIMIT * 0.2);
    for (let i = 0; i < deleteCount; i++) {
      waterLocationCache.delete(keys[i]);
    }
  }
  
  // Normalize longitude to -180 to 180 range
  const normalizedLng = ((longitude + 540) % 360) - 180;
  
  // Fast check for extreme ocean cases
  if (Math.abs(latitude) < 60) {
    // Central Pacific Ocean check (fast reject for obvious ocean cases)
    if ((normalizedLng > -170 && normalizedLng < -120) || 
        (normalizedLng > 160 && normalizedLng <= 180) ||
        (normalizedLng >= -180 && normalizedLng < -170)) {
      waterLocationCache.set(cacheKey, true);
      return true;
    }
    
    // Central Atlantic Ocean check
    if (normalizedLng > -60 && normalizedLng < -30 && 
        latitude > -50 && latitude < 50) {
      waterLocationCache.set(cacheKey, true);
      return true;
    }
    
    // Central Indian Ocean check
    if (normalizedLng > 60 && normalizedLng < 90 && 
        latitude > -40 && latitude < 10) {
      waterLocationCache.set(cacheKey, true);
      return true;
    }
  }
  
  // Check if within any ocean region
  for (const region of OCEAN_REGIONS) {
    if (
      latitude >= region.minLat &&
      latitude <= region.maxLat &&
      normalizedLng >= region.minLng &&
      normalizedLng <= region.maxLng
    ) {
      // For large regions, perform more precise checks
      if (region.name === "Pacific Ocean") {
        // Exclude major land masses in the Pacific
        // North America west coast
        if (latitude >= 25 && latitude <= 60 && normalizedLng >= -130 && normalizedLng <= -115) {
          continue;
        }
        // East Asia/Australia
        if (latitude >= -45 && latitude <= 45 && normalizedLng >= 115 && normalizedLng <= 150) {
          continue;
        }
      }
      
      waterLocationCache.set(cacheKey, true);
      return true;
    }
  }
  
  // Check if within any major lake/inland sea
  for (const lake of MAJOR_LAKES) {
    if (
      latitude >= lake.minLat &&
      latitude <= lake.maxLat &&
      normalizedLng >= lake.minLng &&
      normalizedLng <= lake.maxLng
    ) {
      // Perform more specific checks for some regions that contain land
      if (lake.name === "Mediterranean Sea") {
        // Exclude major islands and coastal areas
        // Sicily, Sardinia, Corsica approximate area
        if (latitude >= 36 && latitude <= 43 && normalizedLng >= 8 && normalizedLng <= 16) {
          continue;
        }
        // Greek islands area
        if (latitude >= 34 && latitude <= 41 && normalizedLng >= 19 && normalizedLng <= 28) {
          continue;
        }
      }
      
      waterLocationCache.set(cacheKey, true);
      return true;
    }
  }
  
  // Additional check for problematic coastal areas
  if (isLikelyCoastalWater(latitude, longitude)) {
    waterLocationCache.set(cacheKey, true);
    return true;
  }
  
  waterLocationCache.set(cacheKey, false);
  return false;
}

/**
 * Validate if a location is suitable for astronomy
 * Filters out water bodies and other unsuitable areas
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param name Optional location name for additional checks
 * @param isCertifiedLocation Whether location is certified dark sky location
 * @returns boolean indicating if location is valid
 */
export function isValidAstronomyLocation(
  latitude: number, 
  longitude: number,
  name?: string,
  isCertifiedLocation: boolean = false
): boolean {
  // Never filter out certified dark sky locations
  if (isCertifiedLocation) {
    return true;
  }
  
  // Check if on water
  if (isWaterLocation(latitude, longitude)) {
    console.log(`Location at ${latitude}, ${longitude} filtered out as water`);
    return false;
  }
  
  // Check if name indicates water
  if (name) {
    const lowerName = name.toLowerCase();
    const waterKeywords = [
      'ocean', 'sea', 'gulf', 'bay', 'strait', 'channel', 'lake', 
      'reservoir', 'pond', 'lagoon', 'harbor', 'harbour', 'port',
      '海', '洋', '湾', '湖', '水库', '池塘', '潟湖', '港',
      'water', 'beach', 'coast', 'shore', 'island', 'peninsula',
      'fjord', 'river', 'stream', 'canal', 'waterway', 'waterfront',
      'marina', 'wharf', 'pier', 'dock', 'quay', 'jetty',
      '水', '滩', '岸', '岛', '半岛', '峡湾', '河', '溪', '运河'
    ];
    
    for (const keyword of waterKeywords) {
      if (lowerName.includes(keyword)) {
        console.log(`Location "${name}" contains water keyword: ${keyword}`);
        return false;
      }
    }
  }
  
  // Extreme polar regions are also challenging for most astronomy
  if (Math.abs(latitude) > 80) {
    console.log(`Location at ${latitude}, ${longitude} is in extreme polar region`);
    return false;
  }
  
  return true;
}

/**
 * Additional check for coastal locations
 * Uses a more sophisticated algorithm to determine if a point is likely on water
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns boolean indicating if location is likely on a coast
 */
export function isLikelyCoastalWater(latitude: number, longitude: number): boolean {
  // This function uses a different approach to check for coastal waters
  // It's designed to catch locations that might be missed by the bounding box approach
  
  // Convert coordinates to 0.1 degree grid cell
  const gridLat = Math.round(latitude * 10) / 10;
  const gridLng = Math.round(longitude * 10) / 10;
  
  // Known problematic coastal grid cells (aggregated from reported issues)
  // Format: "lat,lng"
  const problematicCoastalCells = new Set([
    // East China Sea coastal areas
    "31.1,121.6", "31.2,121.5", "31.3,121.4", 
    // Mediterranean problematic areas
    "43.2,5.4", "43.1,5.5", "41.9,12.5",
    // Caribbean problem spots
    "18.5,-66.1", "18.4,-66.0", "25.8,-80.2",
    // US West Coast
    "37.8,-122.5", "37.7,-122.4", "34.0,-118.5",
    // Other known water spots that may be missed
    "22.3,114.2", "1.3,103.8", "59.9,10.7", "45.5,-73.6",
    // Additional problematic spots in busy coastal areas
    "35.4,139.8", "51.5,-0.1", "40.7,-74.0", "33.6,130.4",
    "19.1,-155.5", "-33.9,151.2", "43.2,-70.6", "21.3,-157.8",
    "29.9,122.3", "24.8,118.6", "37.6,126.7", "13.7,100.5",
    "10.8,106.7", "3.1,101.7", "-6.2,106.8", "32.9,131.0",
    // Additional Asian coastal areas
    "23.1,113.3", "22.5,114.1", "39.1,117.2", "34.8,126.4",
    "30.3,122.1", "36.1,120.4", "38.9,121.6", "40.0,124.3",
    "25.3,119.0", "24.5,118.1", "21.0,110.5", "16.8,112.8",
    "9.0,105.8", "12.2,109.2", "20.8,107.1", "38.6,138.2",
    "33.5,135.8", "34.7,138.9", "35.3,139.8", "35.6,140.1",
    "43.1,141.3", "33.9,131.4", "31.6,130.6", "26.2,127.7"
  ]);
  
  const cellKey = `${gridLat},${gridLng}`;
  if (problematicCoastalCells.has(cellKey)) {
    console.log(`Location at ${latitude}, ${longitude} matched known coastal water cell ${cellKey}`);
    return true;
  }
  
  return false;
}
