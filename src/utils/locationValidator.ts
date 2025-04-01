
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
    return false;
  }
  
  // Check if name indicates water
  if (name) {
    const lowerName = name.toLowerCase();
    const waterKeywords = [
      'ocean', 'sea', 'gulf', 'bay', 'strait', 'channel', 'lake', 
      'reservoir', 'pond', 'lagoon', 'harbor', 'harbour', 'port',
      '海', '洋', '湾', '湖', '水库', '池塘', '潟湖', '港'
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
