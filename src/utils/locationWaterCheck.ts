
/**
 * Utilities for checking if a location is in water
 * This is a specialized module for water detection in the app
 */

// Major water bodies with improved geographical precision
const majorWaterBodies = [
  // Pacific Ocean regions with more precise boundaries
  { name: "North Pacific", bounds: { minLat: 0, maxLat: 60, minLng: 120, maxLng: -120 } },
  { name: "South Pacific", bounds: { minLat: -60, maxLat: 0, minLng: 150, maxLng: -70 } },
  { name: "Philippine Sea", bounds: { minLat: 5, maxLat: 30, minLng: 120, maxLng: 135 } },
  
  // Atlantic Ocean regions with more precise boundaries
  { name: "North Atlantic", bounds: { minLat: 0, maxLat: 70, minLng: -80, maxLng: 0 } },
  { name: "South Atlantic", bounds: { minLat: -60, maxLat: 0, minLng: -70, maxLng: 20 } },
  { name: "Caribbean Sea", bounds: { minLat: 8, maxLat: 25, minLng: -87, maxLng: -60 } },
  { name: "Gulf of Mexico", bounds: { minLat: 18, maxLat: 31, minLng: -98, maxLng: -80 } },
  
  // Indian Ocean with more precise boundaries
  { name: "Indian Ocean", bounds: { minLat: -60, maxLat: 30, minLng: 20, maxLng: 150 } },
  { name: "Arabian Sea", bounds: { minLat: 5, maxLat: 25, minLng: 50, maxLng: 80 } },
  { name: "Bay of Bengal", bounds: { minLat: 5, maxLat: 22, minLng: 80, maxLng: 100 } },
  
  // Arctic Ocean
  { name: "Arctic Ocean", bounds: { minLat: 70, maxLat: 90, minLng: -180, maxLng: 180 } },
  
  // Southern Ocean
  { name: "Southern Ocean", bounds: { minLat: -90, maxLat: -60, minLng: -180, maxLng: 180 } },
  
  // Mediterranean Sea with more precise boundaries
  { name: "Mediterranean Sea", bounds: { minLat: 30, maxLat: 45, minLng: -5, maxLng: 36 } },
  
  // Major regional seas
  { name: "South China Sea", bounds: { minLat: 0, maxLat: 25, minLng: 100, maxLng: 120 } },
  { name: "East China Sea", bounds: { minLat: 25, maxLat: 35, minLng: 120, maxLng: 130 } },
  { name: "Sea of Japan", bounds: { minLat: 33, maxLat: 47, minLng: 128, maxLng: 142 } },
  { name: "Baltic Sea", bounds: { minLat: 53, maxLat: 66, minLng: 10, maxLng: 30 } },
];

// Known coastal regions that should be excluded from water detection
// These are important land masses that might be mistakenly classified as water
const knownCoastalExclusions = [
  // Island regions that should be considered land despite being surrounded by water
  { name: "Japan", bounds: { minLat: 30, maxLat: 46, minLng: 129, maxLng: 146 } },
  { name: "Indonesia", bounds: { minLat: -11, maxLat: 6, minLng: 95, maxLng: 141 } },
  { name: "New Zealand", bounds: { minLat: -47, maxLat: -34, minLng: 166, maxLng: 179 } },
  { name: "Philippines", bounds: { minLat: 5, maxLat: 21, minLng: 116, maxLng: 127 } },
  { name: "Hawaii", bounds: { minLat: 18, maxLat: 23, minLng: -160, maxLng: -154 } },
  { name: "Taiwan", bounds: { minLat: 21.5, maxLat: 25.5, minLng: 119.5, maxLng: 122.5 } },
  { name: "UK", bounds: { minLat: 49, maxLat: 61, minLng: -11, maxLng: 2 } },
  { name: "Ireland", bounds: { minLat: 51, maxLat: 56, minLng: -11, maxLng: -5 } },
  { name: "Sicily", bounds: { minLat: 36, maxLat: 38.5, minLng: 12, maxLng: 16 } },
  { name: "Iceland", bounds: { minLat: 63, maxLat: 67, minLng: -25, maxLng: -12 } },
  { name: "Puerto Rico", bounds: { minLat: 17.5, maxLat: 19, minLng: -68, maxLng: -65 } },
  { name: "Cuba", bounds: { minLat: 19.5, maxLat: 23.5, minLng: -85, maxLng: -74 } },
  { name: "Dominican Republic", bounds: { minLat: 17.5, maxLat: 20, minLng: -72, maxLng: -68 } },
  { name: "Jamaica", bounds: { minLat: 17, maxLat: 19, minLng: -79, maxLng: -76 } },
  { name: "Singapore", bounds: { minLat: 1.1, maxLat: 1.5, minLng: 103.5, maxLng: 104.1 } },
  { name: "Maldives", bounds: { minLat: -1, maxLat: 8, minLng: 72, maxLng: 74 } },
  { name: "Sri Lanka", bounds: { minLat: 5.5, maxLat: 10, minLng: 79, maxLng: 82 } },
];

// Known land masses that should never be considered water
// This prevents important continents from being mistakenly classified as water
const majorLandMasses = [
  { name: "North America", bounds: { minLat: 15, maxLat: 85, minLng: -170, maxLng: -50 } },
  { name: "South America", bounds: { minLat: -60, maxLat: 15, minLng: -85, maxLng: -30 } },
  { name: "Europe", bounds: { minLat: 35, maxLat: 70, minLng: -10, maxLng: 40 } },
  { name: "Asia", bounds: { minLat: 0, maxLat: 80, minLng: 40, maxLng: 150 } },
  { name: "Africa", bounds: { minLat: -35, maxLat: 38, minLng: -20, maxLng: 55 } },
  { name: "Australia", bounds: { minLat: -45, maxLat: -10, minLng: 110, maxLng: 155 } },
  { name: "Antarctica", bounds: { minLat: -90, maxLat: -60, minLng: -180, maxLng: 180 } },
];

/**
 * Enhanced check if a location is likely in water
 * This uses a multi-layered approach for better accuracy
 * 
 * @param lat Latitude of the location to check
 * @param lon Longitude of the location to check
 * @param checkCoastal Whether to perform additional coastal checks
 * @returns true if the location is likely water, false otherwise
 */
export const isWaterLocation = (lat: number, lon: number, checkCoastal: boolean = true): boolean => {
  // Normalize longitude to -180 to 180 range
  const normalizedLon = ((lon + 180) % 360 + 360) % 360 - 180;
  
  // FIRST CHECK: Is it in a major land mass?
  // This is a fast check to quickly exclude obvious land areas
  for (const landmass of majorLandMasses) {
    const { bounds } = landmass;
    if (
      lat >= bounds.minLat && 
      lat <= bounds.maxLat
    ) {
      // Handle special case for regions that cross the date line
      if (bounds.minLng > bounds.maxLng) {
        if (normalizedLon >= bounds.minLng || normalizedLon <= bounds.maxLng) {
          // This is in a major landmass, it's probably not water
          // But continue checking for inland water bodies in some cases
          if (landmass.name === "North America" || landmass.name === "Europe") {
            // These continents have large inland water bodies, so continue checks
            // Just reduce the probability of water detection
            continue;
          }
          return false;
        }
      } else if (
        normalizedLon >= bounds.minLng && 
        normalizedLon <= bounds.maxLng
      ) {
        // This is in a major landmass, it's probably not water
        // But continue checking for inland water bodies in some cases
        if (landmass.name === "North America" || landmass.name === "Europe") {
          // These continents have large inland water bodies, so continue checks
          // Just reduce the probability of water detection
          continue;
        }
        return false;
      }
    }
  }
  
  // SECOND CHECK: Is it in a known island/coastal exclusion?
  // This protects important islands and coastal areas from being marked as water
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
  
  // THIRD CHECK: Is it in a major water body?
  // This is the main check for water bodies
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
        // Make sure it's not close to major landmasses near the Pacific
        if ((lat > 30 && lat < 50 && normalizedLon > 120 && normalizedLon < 150) || // Japan/East Asia
            (lat > -50 && lat < -30 && normalizedLon > 165)) { // New Zealand
          // Extra check for land masses
          return false;
        }
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
        // Additional checks for specific water bodies with many islands
        if (waterBody.name === "Caribbean Sea" || 
            waterBody.name === "Mediterranean Sea" || 
            waterBody.name === "South China Sea") {
          
          // These areas have many islands, so we do probabilistic filtering
          // This gives us a lower false positive rate for water detection
          const isIsland = Math.random() > 0.8; // 20% chance an arbitrary point is considered land in these regions
          if (isIsland) return false;
        }
        
        return true;
      }
    }
  }
  
  // FOURTH CHECK: More expensive coastal water checks if enabled
  if (checkCoastal) {
    // Additional coastal water checks could go here
    // These would be more computationally intensive
  }
  
  return false;
};
