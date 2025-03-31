import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { darkSkyLocations } from '@/data/regions/darkSkyLocations';
import { calculateDistance } from '@/data/utils/distanceCalculator';

/**
 * Get certified Dark Sky locations from the database
 * Uses the actual Dark Sky International locations
 * @param centerLat - Latitude of center point
 * @param centerLng - Longitude of center point
 * @param radiusKm - Search radius in kilometers
 * @returns Array of SharedAstroSpot
 */
export function getCertifiedLocationsNearby(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): SharedAstroSpot[] {
  const locations: SharedAstroSpot[] = [];
  
  // Official certification types based on Dark Sky International
  const certificationTypes = {
    'dark-sky-sanctuary': 'International Dark Sky Sanctuary',
    'dark-sky-reserve': 'International Dark Sky Reserve',
    'dark-sky-park': 'International Dark Sky Park',
    'dark-sky-community': 'International Dark Sky Community',
    'urban-night-sky-place': 'Urban Night Sky Place'
  };
  
  // Go through our database of real Dark Sky locations
  for (const location of darkSkyLocations) {
    const distance = calculateDistance(
      centerLat, 
      centerLng, 
      location.coordinates[0], 
      location.coordinates[1]
    );
    
    if (distance <= radiusKm) {
      // Determine certification type based on location name or type
      let certification = '';
      let isDarkSkyReserve = false;
      
      const lowerName = location.name.toLowerCase();
      
      if (lowerName.includes('sanctuary') || lowerName.includes('wildernes')) {
        certification = certificationTypes['dark-sky-sanctuary'];
      } else if (lowerName.includes('reserve')) {
        certification = certificationTypes['dark-sky-reserve'];
        isDarkSkyReserve = true;
      } else if (lowerName.includes('community') || 
                lowerName.includes('village') || 
                lowerName.includes('town') ||
                lowerName.includes('city')) {
        certification = certificationTypes['dark-sky-community'];
      } else if (lowerName.includes('urban')) {
        certification = certificationTypes['urban-night-sky-place'];
      } else {
        // Default to park for national parks, state parks, etc.
        certification = certificationTypes['dark-sky-park'];
      }
      
      // Calculate a realistic SIQS score based on Bortle scale
      // Dark Sky locations tend to have excellent sky quality
      const baseSiqs = 10 - location.bortleScale;
      // Add some variability but keep scores high for certified locations
      const siqs = Math.max(7, Math.min(9, baseSiqs + (Math.random() * 1.5)));
      
      locations.push({
        id: `certified-${locations.length}-${Date.now()}`,
        name: location.name,
        // Chinese name is transliteration with "Dark Sky" prefix
        chineseName: `暗夜天空 ${location.name}`,
        latitude: location.coordinates[0],
        longitude: location.coordinates[1],
        bortleScale: location.bortleScale,
        siqs: siqs,
        isViable: true,
        distance: distance,
        description: `An officially certified dark sky location designated by the International Dark-Sky Association.`,
        timestamp: new Date().toISOString(),
        isDarkSkyReserve: isDarkSkyReserve,
        certification: certification
      });
    }
  }
  
  return locations;
}

/**
 * Generate a single sample location for quick testing
 * @returns SharedAstroSpot with sample data
 */
export function getSampleLocation(): SharedAstroSpot {
  return {
    id: `sample-location-${Date.now()}`,
    name: "Sample Dark Sky Location",
    chineseName: "示例暗夜地点",
    latitude: 40.7128,
    longitude: -74.0060,
    bortleScale: 3,
    siqs: 8.5,
    isViable: true,
    distance: 0,
    description: "A sample dark sky location for testing",
    timestamp: new Date().toISOString(),
    isDarkSkyReserve: true,
    certification: "International Dark Sky Reserve"
  };
}
