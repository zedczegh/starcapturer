
/**
 * Utilities for checking if a location is in water
 * This is a simplified version to avoid circular imports
 */

// Approximate water detection based on known oceans and seas
const majorWaterBodies = [
  // Pacific Ocean regions
  { name: "North Pacific", bounds: { minLat: 0, maxLat: 60, minLng: 120, maxLng: -120 } },
  { name: "South Pacific", bounds: { minLat: -60, maxLat: 0, minLng: 150, maxLng: -70 } },
  
  // Atlantic Ocean regions
  { name: "North Atlantic", bounds: { minLat: 0, maxLat: 70, minLng: -80, maxLng: 0 } },
  { name: "South Atlantic", bounds: { minLat: -60, maxLat: 0, minLng: -70, maxLng: 20 } },
  
  // Indian Ocean
  { name: "Indian Ocean", bounds: { minLat: -60, maxLat: 30, minLng: 20, maxLng: 150 } },
  
  // Arctic Ocean
  { name: "Arctic Ocean", bounds: { minLat: 70, maxLat: 90, minLng: -180, maxLng: 180 } },
  
  // Southern Ocean
  { name: "Southern Ocean", bounds: { minLat: -90, maxLat: -60, minLng: -180, maxLng: 180 } },
];

// Known coastal regions that should be excluded from water detection
const knownCoastalExclusions = [
  // Island regions that should be considered land despite being surrounded by water
  { name: "Japan", bounds: { minLat: 30, maxLat: 46, minLng: 129, maxLng: 146 } },
  { name: "Indonesia", bounds: { minLat: -11, maxLat: 6, minLng: 95, maxLng: 141 } },
  { name: "New Zealand", bounds: { minLat: -47, maxLat: -34, minLng: 166, maxLng: 179 } },
  { name: "Philippines", bounds: { minLat: 5, maxLat: 21, minLng: 116, maxLng: 127 } },
  { name: "Hawaii", bounds: { minLat: 18, maxLat: 23, minLng: -160, maxLng: -154 } },
];

/**
 * Basic check if a location is likely in water
 * This is a simplified version to avoid circular imports
 */
export const isWaterLocation = (lat: number, lon: number, checkCoastal: boolean = true): boolean => {
  // Normalize longitude to -180 to 180 range
  const normalizedLon = ((lon + 180) % 360 + 360) % 360 - 180;
  
  // Check if in known island/coastal exclusions first
  for (const exclusion of knownCoastalExclusions) {
    const { bounds } = exclusion;
    if (
      lat >= bounds.minLat && 
      lat <= bounds.maxLat && 
      normalizedLon >= bounds.minLng && 
      normalizedLon <= bounds.maxLng
    ) {
      return false; // This is a known land area
    }
  }
  
  // Check if in major water bodies
  for (const waterBody of majorWaterBodies) {
    const { bounds } = waterBody;
    
    // Handle special case of Pacific Ocean crossing the date line
    if (waterBody.name.includes("Pacific")) {
      // For the Pacific, we need to check differently because it crosses the date line
      if (
        lat >= bounds.minLat && 
        lat <= bounds.maxLat && 
        (normalizedLon >= bounds.minLng || normalizedLon <= bounds.maxLng)
      ) {
        return true;
      }
    } else {
      // For other water bodies
      if (
        lat >= bounds.minLat && 
        lat <= bounds.maxLat && 
        normalizedLon >= bounds.minLng && 
        normalizedLon <= bounds.maxLng
      ) {
        return true;
      }
    }
  }
  
  return false;
};
