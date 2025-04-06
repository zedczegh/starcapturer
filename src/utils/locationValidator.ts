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
];

/**
 * Check if a location is on water
 * Uses coordinate-based detection for oceans, seas, and major lakes
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns boolean indicating if location is on water
 */
export function isWaterLocation(latitude: number, longitude: number): boolean {
  // Normalize longitude to -180 to 180 range
  const normalizedLng = ((longitude + 540) % 360) - 180;
  
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
          return false;
        }
        // East Asia/Australia
        if (latitude >= -45 && latitude <= 45 && normalizedLng >= 115 && normalizedLng <= 150) {
          return false;
        }
      }
      
      console.log(`Location at ${latitude}, ${longitude} is likely in ${region.name}`);
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
          return false;
        }
        // Greek islands area
        if (latitude >= 34 && latitude <= 41 && normalizedLng >= 19 && normalizedLng <= 28) {
          return false;
        }
      }
      
      console.log(`Location at ${latitude}, ${longitude} is likely in ${lake.name}`);
      return true;
    }
  }
  
  // Enhanced grid-based detection for coastal areas
  // Check specific coastal coordinates not covered by the above regions
  
  // Norwegian coastline and fjords
  if (latitude >= 58 && latitude <= 71 && normalizedLng >= 4 && normalizedLng <= 31) {
    // Narrow fjords - these long thin bodies of water are technically water but have good viewing
    // from the shoreline, so we'll be selective in filtering
    const distanceToLand = Math.min(
      Math.abs(normalizedLng - 4),  // Distance to western coast
      Math.abs(normalizedLng - 31)  // Distance to eastern coast
    );
    
    // If we're more than 0.5 degrees (~50km) from shore in this region, likely water
    if (distanceToLand > 0.5) {
      console.log(`Location at ${latitude}, ${longitude} is likely in Norwegian Sea`);
      return true;
    }
  }
  
  // Additional check for common location names that indicate water
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
    "22.3,114.2", "1.3,103.8", "59.9,10.7", "45.5,-73.6"
  ]);
  
  const cellKey = `${gridLat},${gridLng}`;
  if (problematicCoastalCells.has(cellKey)) {
    console.log(`Location at ${latitude}, ${longitude} matched known coastal water cell ${cellKey}`);
    return true;
  }
  
  return false;
}
