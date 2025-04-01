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
  
  // New: Additional bodies of water
  // Japan Sea coast
  { minLat: 33, maxLat: 42, minLng: 134, maxLng: 140, name: "Japan Sea Coast" },
  
  // Taiwan Strait
  { minLat: 23, maxLat: 26, minLng: 118, maxLng: 121, name: "Taiwan Strait" },
  
  // South Pacific Islands
  { minLat: -20, maxLat: 0, minLng: 160, maxLng: -160, name: "South Pacific Islands" },
  
  // Java Sea
  { minLat: -8, maxLat: 0, minLng: 105, maxLng: 120, name: "Java Sea" },
  
  // Andaman Sea
  { minLat: 5, maxLat: 14, minLng: 92, maxLng: 100, name: "Andaman Sea" },
  
  // Bohai Sea
  { minLat: 37, maxLat: 41, minLng: 117, maxLng: 122, name: "Bohai Sea" },
  
  // New: Accurately define common coastal problem areas
  // Shenzhen Bay
  { minLat: 22.4, maxLat: 22.6, minLng: 113.8, maxLng: 114.1, name: "Shenzhen Bay" },
  
  // Hangzhou Bay
  { minLat: 30.0, maxLat: 30.6, minLng: 120.8, maxLng: 122.0, name: "Hangzhou Bay" },
  
  // Tokyo Bay
  { minLat: 35.2, maxLat: 35.9, minLng: 139.5, maxLng: 140.0, name: "Tokyo Bay" },
];

// Additional problematic coastal cells - specific coordinates known to be water
// These are specific problem areas not captured by the larger regions
const COASTAL_PROBLEM_COORDINATES = [
  // East China Sea problem spots
  { lat: 31.1, lng: 121.6 }, { lat: 31.2, lng: 121.5 }, { lat: 31.3, lng: 121.4 },
  { lat: 31.0, lng: 121.7 }, { lat: 30.9, lng: 121.8 }, { lat: 30.8, lng: 121.9 },
  
  // Japan coastal areas
  { lat: 35.6, lng: 139.8 }, { lat: 35.5, lng: 139.8 }, { lat: 35.4, lng: 139.7 },
  { lat: 34.6, lng: 135.5 }, { lat: 34.7, lng: 135.4 }, { lat: 34.8, lng: 135.3 },
  
  // Hong Kong/Macau waters
  { lat: 22.3, lng: 114.2 }, { lat: 22.2, lng: 114.1 }, { lat: 22.1, lng: 113.9 },
  { lat: 22.05, lng: 113.55 }, { lat: 22.15, lng: 113.6 },
  
  // Taiwan Strait
  { lat: 24.5, lng: 118.4 }, { lat: 24.6, lng: 118.3 }, { lat: 24.7, lng: 118.2 },
  
  // Philippine coastal waters
  { lat: 14.5, lng: 120.9 }, { lat: 14.6, lng: 121.0 }, { lat: 14.7, lng: 121.1 },
  
  // Singapore waters
  { lat: 1.3, lng: 103.8 }, { lat: 1.4, lng: 103.9 }, { lat: 1.2, lng: 103.7 },
  
  // Additional global problematic coastal areas
  { lat: 59.9, lng: 10.7 }, { lat: 45.5, lng: -73.6 }, { lat: 37.8, lng: -122.5 },
  { lat: 43.2, lng: 5.4 }, { lat: 43.1, lng: 5.5 }, { lat: 41.9, lng: 12.5 },
  { lat: 18.5, lng: -66.1 }, { lat: 18.4, lng: -66.0 }, { lat: 25.8, lng: -80.2 },
  { lat: 37.7, lng: -122.4 }, { lat: 34.0, lng: -118.5 },
  
  // New: Additional known problem spots
  { lat: 36.9, lng: 120.9 }, { lat: 29.7, lng: 121.8 }, { lat: 25.3, lng: 119.5 },
  { lat: 39.0, lng: 117.7 }, { lat: 40.8, lng: 122.2 }, { lat: 38.9, lng: 121.6 },
  { lat: 23.1, lng: 113.4 }, { lat: 21.2, lng: 110.4 }, { lat: 20.0, lng: 110.3 },
  { lat: 19.6, lng: 109.0 }, { lat: 32.1, lng: 118.8 }, { lat: 32.2, lng: 119.2 },
  { lat: 30.2, lng: 122.1 }, { lat: 28.1, lng: 121.4 }, { lat: 27.5, lng: 120.1 },
  { lat: 26.1, lng: 119.9 },
];

/**
 * Check if a location is within a bounding box
 */
function isInBoundingBox(
  latitude: number, 
  longitude: number, 
  minLat: number, 
  maxLat: number, 
  minLng: number, 
  maxLng: number
): boolean {
  // Normalize longitude to -180 to 180 range
  const normalizedLng = ((longitude + 540) % 360) - 180;
  
  return (
    latitude >= minLat &&
    latitude <= maxLat &&
    normalizedLng >= minLng &&
    normalizedLng <= maxLng
  );
}

/**
 * Check if a location matches a specific problematic coordinate
 * Using a small grid size for precision
 */
function isNearProblematicCoordinate(
  latitude: number, 
  longitude: number, 
  gridSize: number = 0.05
): boolean {
  for (const coord of COASTAL_PROBLEM_COORDINATES) {
    if (
      Math.abs(latitude - coord.lat) <= gridSize &&
      Math.abs(longitude - coord.lng) <= gridSize
    ) {
      console.log(`Location at ${latitude}, ${longitude} matches problematic coordinate ${coord.lat}, ${coord.lng}`);
      return true;
    }
  }
  return false;
}

/**
 * Check if a location is on water
 * Uses coordinate-based detection for oceans, seas, and major lakes
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns boolean indicating if location is on water
 */
export function isWaterLocation(latitude: number, longitude: number): boolean {
  // Quick check for specific problematic coordinates first
  if (isNearProblematicCoordinate(latitude, longitude)) {
    return true;
  }
  
  // Check if within any ocean region
  for (const region of OCEAN_REGIONS) {
    if (isInBoundingBox(latitude, longitude, region.minLat, region.maxLat, region.minLng, region.maxLng)) {
      // For large regions, perform more precise checks
      if (region.name === "Pacific Ocean") {
        // Exclude major land masses in the Pacific
        // North America west coast
        if (isInBoundingBox(latitude, longitude, 25, 60, -130, -115)) {
          return false;
        }
        // East Asia/Australia
        if (isInBoundingBox(latitude, longitude, -45, 45, 115, 150)) {
          return false;
        }
      }
      
      console.log(`Location at ${latitude}, ${longitude} is likely in ${region.name}`);
      return true;
    }
  }
  
  // Check if within any major lake/inland sea
  for (const lake of MAJOR_LAKES) {
    if (isInBoundingBox(latitude, longitude, lake.minLat, lake.maxLat, lake.minLng, lake.maxLng)) {
      // Perform more specific checks for some regions that contain land
      if (lake.name === "Mediterranean Sea") {
        // Exclude major islands and coastal areas
        // Sicily, Sardinia, Corsica approximate area
        if (isInBoundingBox(latitude, longitude, 36, 43, 8, 16)) {
          return false;
        }
        // Greek islands area
        if (isInBoundingBox(latitude, longitude, 34, 41, 19, 28)) {
          return false;
        }
      }
      
      console.log(`Location at ${latitude}, ${longitude} is likely in ${lake.name}`);
      return true;
    }
  }
  
  // Check for coastal grid cells
  if (isLikelyCoastalWater(latitude, longitude)) {
    return true;
  }
  
  // Enhanced grid-based detection for coastal areas
  // Norwegian coastline and fjords
  if (isInBoundingBox(latitude, longitude, 58, 71, 4, 31)) {
    // If we're more than 0.5 degrees (~50km) from shore in this region, likely water
    const distanceToLand = Math.min(
      Math.abs(longitude - 4),  // Distance to western coast
      Math.abs(longitude - 31)  // Distance to eastern coast
    );
    
    if (distanceToLand > 0.5) {
      console.log(`Location at ${latitude}, ${longitude} is likely in Norwegian Sea`);
      return true;
    }
  }
  
  // Additional check for common location names that indicate water
  return false;
}

/**
 * Additional check for coastal locations
 * Uses a more sophisticated algorithm to determine if a point is likely on water
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns boolean indicating if location is likely on a coast
 */
export function isLikelyCoastalWater(latitude: number, longitude: number): boolean {
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
    
    // New problematic areas
    "36.9,120.9", "29.7,121.8", "25.3,119.5", "39.0,117.7", 
    "40.8,122.2", "38.9,121.6", "23.1,113.4", "21.2,110.4", 
    "20.0,110.3", "19.6,109.0", "32.1,118.8", "32.2,119.2",
    "30.2,122.1", "28.1,121.4", "27.5,120.1", "26.1,119.9",
    "35.6,139.8", "35.5,139.8", "34.6,135.5", "14.5,120.9"
  ]);
  
  const cellKey = `${gridLat},${gridLng}`;
  if (problematicCoastalCells.has(cellKey)) {
    console.log(`Location at ${latitude}, ${longitude} matched known coastal water cell ${cellKey}`);
    return true;
  }
  
  return false;
}

/**
 * Validate if a location is suitable for astronomy
 * Filters out water bodies and other unsuitable areas
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param name Optional location name for additional checks
 * @returns boolean indicating if location is valid
 */
export function isValidAstronomyLocation(
  latitude: number, 
  longitude: number,
  name?: string
): boolean {
  // Check if coordinates are valid
  if (!isFinite(latitude) || !isFinite(longitude) || 
      latitude < -90 || latitude > 90 || 
      longitude < -180 || longitude > 180) {
    console.log(`Invalid coordinates: ${latitude}, ${longitude}`);
    return false;
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
      '水', '滩', '岸', '岛', '半岛', '峡湾', '河', '溪', '运河',
      // New water-related terms
      'laguna', 'atoll', 'reef', 'cove', 'sound', 'bight', 'inlet',
      'estuary', 'delta', 'archipelago', 'isthmus', 'islet', 'cape',
      'promontory', 'headland', 'coral', 'maritime', 'seaport',
      'seaside', 'seashore', 'coastline', 'offshore', 'anchoring',
      'boating', 'sailing', 'fishing', 'naval', 'nautical',
      '礁', '湿地', '鱼场', '渔港', '航道'
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
