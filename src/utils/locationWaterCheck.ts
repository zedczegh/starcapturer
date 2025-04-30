
/**
 * Utilities for checking if a location is in water
 * This is a simplified version to avoid circular imports
 */

// Refined water detection bounding boxes with better precision
const majorWaterBodies = [
  // Pacific Ocean regions (adjusted to reduce false positives near coastlines)
  { name: "North Pacific", bounds: { minLat: 5, maxLat: 55, minLng: 140, maxLng: -140 } },
  { name: "South Pacific", bounds: { minLat: -55, maxLat: -5, minLng: 160, maxLng: -80 } },
  
  // Atlantic Ocean regions (adjusted)
  { name: "North Atlantic", bounds: { minLat: 5, maxLat: 65, minLng: -75, maxLng: -5 } },
  { name: "South Atlantic", bounds: { minLat: -55, maxLat: -5, minLng: -60, maxLng: 10 } },
  
  // Indian Ocean (adjusted)
  { name: "Indian Ocean", bounds: { minLat: -55, maxLat: 25, minLng: 30, maxLng: 100 } },
  
  // Arctic Ocean (adjusted)
  { name: "Arctic Ocean", bounds: { minLat: 75, maxLat: 90, minLng: -180, maxLng: 180 } },
  
  // Southern Ocean (adjusted)
  { name: "Southern Ocean", bounds: { minLat: -90, maxLat: -65, minLng: -180, maxLng: 180 } },
];

// Expanded list of coastal regions that should be excluded from water detection
const knownCoastalExclusions = [
  // Major continents' coastal regions
  { name: "North America East Coast", bounds: { minLat: 25, maxLat: 50, minLng: -82, maxLng: -60 } },
  { name: "North America West Coast", bounds: { minLat: 30, maxLat: 60, minLng: -130, maxLng: -115 } },
  { name: "Europe", bounds: { minLat: 35, maxLat: 70, minLng: -10, maxLng: 40 } },
  { name: "East Asia", bounds: { minLat: 20, maxLat: 45, minLng: 100, maxLng: 145 } },
  { name: "Southeast Asia", bounds: { minLat: -10, maxLat: 20, minLng: 95, maxLng: 140 } },
  { name: "Australia", bounds: { minLat: -45, maxLat: -10, minLng: 110, maxLng: 155 } },
  { name: "South America", bounds: { minLat: -55, maxLat: 15, minLng: -80, maxLng: -35 } },
  { name: "Africa", bounds: { minLat: -35, maxLat: 35, minLng: -20, maxLng: 50 } },
  
  // Island regions that should be considered land despite being surrounded by water
  { name: "Japan", bounds: { minLat: 30, maxLat: 46, minLng: 129, maxLng: 146 } },
  { name: "Indonesia", bounds: { minLat: -11, maxLat: 6, minLng: 95, maxLng: 141 } },
  { name: "New Zealand", bounds: { minLat: -47, maxLat: -34, minLng: 166, maxLng: 179 } },
  { name: "Philippines", bounds: { minLat: 5, maxLat: 21, minLng: 116, maxLng: 127 } },
  { name: "Hawaii", bounds: { minLat: 18, maxLat: 23, minLng: -160, maxLng: -154 } },
  { name: "UK and Ireland", bounds: { minLat: 50, maxLat: 59, minLng: -10, maxLng: 2 } },
  { name: "Caribbean", bounds: { minLat: 10, maxLat: 25, minLng: -85, maxLng: -60 } },
  { name: "Mediterranean Islands", bounds: { minLat: 35, maxLat: 45, minLng: 0, maxLng: 30 } },
];

// Buffer distance in degrees to prevent coastline false positives
const COASTAL_BUFFER = 0.5;

/**
 * Improved check if a location is likely in water
 * More accurate algorithm with better handling of land mass boundaries
 */
export const isWaterLocation = (lat: number, lon: number, checkCoastal: boolean = true): boolean => {
  // Normalize longitude to -180 to 180 range
  const normalizedLon = ((lon + 180) % 360 + 360) % 360 - 180;
  
  // First check if we're in a known land area (coastal exclusions)
  // This takes priority to prevent false water positives near coastlines
  for (const exclusion of knownCoastalExclusions) {
    const { bounds } = exclusion;
    
    // Apply buffer to bounds for better accuracy
    const bufferedBounds = checkCoastal ? {
      minLat: bounds.minLat - COASTAL_BUFFER,
      maxLat: bounds.maxLat + COASTAL_BUFFER,
      minLng: bounds.minLng - COASTAL_BUFFER,
      maxLng: bounds.maxLng + COASTAL_BUFFER
    } : bounds;
    
    if (
      lat >= bufferedBounds.minLat && 
      lat <= bufferedBounds.maxLat && 
      normalizedLon >= bufferedBounds.minLng && 
      normalizedLon <= bufferedBounds.maxLng
    ) {
      return false; // This is a known land area
    }
  }
  
  // Now check if in major water bodies, but with coastline buffer
  // to prevent identifying coastal areas as water
  for (const waterBody of majorWaterBodies) {
    const { bounds } = waterBody;
    
    // Apply narrow buffer to water bounds to reduce false positives
    const bufferedBounds = {
      minLat: bounds.minLat + (checkCoastal ? COASTAL_BUFFER : 0),
      maxLat: bounds.maxLat - (checkCoastal ? COASTAL_BUFFER : 0),
      minLng: bounds.minLng + (checkCoastal ? COASTAL_BUFFER : 0),
      maxLng: bounds.maxLng - (checkCoastal ? COASTAL_BUFFER : 0)
    };
    
    // Handle special case of Pacific Ocean crossing the date line
    if (waterBody.name.includes("Pacific")) {
      // For the Pacific, we need to check differently because it crosses the date line
      if (
        lat >= bufferedBounds.minLat && 
        lat <= bufferedBounds.maxLat && 
        (normalizedLon >= bufferedBounds.minLng || normalizedLon <= bufferedBounds.maxLng)
      ) {
        // Additional check: Pacific Ocean edges have more land masses
        // Double check if we're close to continental borders
        if (checkCoastal && (
            (normalizedLon >= 135 && normalizedLon <= 150) || // East Asia coast
            (normalizedLon <= -115 && normalizedLon >= -130) // West Americas coast
        )) {
          return false; // Likely coastal area, not deep water
        }
        return true;
      }
    } else {
      // For other water bodies
      if (
        lat >= bufferedBounds.minLat && 
        lat <= bufferedBounds.maxLat && 
        normalizedLon >= bufferedBounds.minLng && 
        normalizedLon <= bufferedBounds.maxLng
      ) {
        return true;
      }
    }
  }
  
  // If we're not in any defined water body, default to land
  return false;
};
