import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";
import { darkSkyLocations } from "@/data/regions/darkSkyLocations";

/**
 * Get certified Dark Sky locations near specified coordinates
 * @param centerLat Latitude of center point
 * @param centerLng Longitude of center point
 * @param radiusKm Search radius in kilometers
 * @returns Array of SharedAstroSpot representing certified locations
 */
export const getCertifiedLocationsNearby = (
  centerLat: number,
  centerLng: number,
  radiusKm: number
): SharedAstroSpot[] => {
  const locations: SharedAstroSpot[] = [];
  
  // Official certification types based on Dark Sky International
  const certificationTypes = {
    'dark-sky-sanctuary': 'International Dark Sky Sanctuary',
    'dark-sky-reserve': 'International Dark Sky Reserve',
    'dark-sky-park': 'International Dark Sky Park',
    'dark-sky-community': 'International Dark Sky Community',
    'urban-night-sky-place': 'Urban Night Sky Place'
  };
  
  // Quickly generate country mappings for sample data
  const countryMapping: { [key: string]: { county: string; state: string; country: string } } = {
    "Cherry Springs State Park": { county: "Potter County", state: "Pennsylvania", country: "USA" },
    "NamibRand Nature Reserve": { county: "Hardap Region", state: "Namibia", country: "Africa" },
    "Aoraki Mackenzie": { county: "Canterbury", state: "South Island", country: "New Zealand" },
    "Pic du Midi": { county: "Hautes-Pyrénées", state: "Occitanie", country: "France" },
    "Mont-Mégantic": { county: "Estrie", state: "Quebec", country: "Canada" },
    "Exmoor National Park": { county: "Somerset", state: "England", country: "United Kingdom" },
    "Galloway Forest Park": { county: "Dumfries", state: "Scotland", country: "United Kingdom" },
    "Westhavelland Nature Park": { county: "Brandenburg", state: "Brandenburg", country: "Germany" },
    "Zselic Starry Sky Park": { county: "Somogy", state: "Southern Transdanubia", country: "Hungary" },
    "Jasper National Park": { county: "Alberta", state: "Alberta", country: "Canada" }
  };
  
  // Process dark sky locations
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
      const baseSiqs = 10 - location.bortleScale;
      // Add some variability but keep scores high for certified locations
      const siqs = Math.max(7, Math.min(9, baseSiqs + (Math.random() * 1.5)));
      
      // Get location details from mapping or provide defaults
      const locationDetails = countryMapping[location.name] || {
        county: "Unknown County",
        state: "Unknown State",
        country: "Unknown Country"
      };
      
      locations.push({
        id: `certified-${locations.length}-${Date.now()}`,
        name: location.name,
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
        certification: certification,
        county: locationDetails.county,
        state: locationDetails.state,
        country: locationDetails.country
      });
    }
  }
  
  return locations;
};

/**
 * Get all certified Dark Sky locations
 * @returns Array of SharedAstroSpot representing all certified locations
 */
export const getAllCertifiedLocations = (): SharedAstroSpot[] => {
  // Quickly generate country mappings for sample data
  const countryMapping: { [key: string]: { county: string; state: string; country: string } } = {
    "Cherry Springs State Park": { county: "Potter County", state: "Pennsylvania", country: "USA" },
    "NamibRand Nature Reserve": { county: "Hardap Region", state: "Namibia", country: "Africa" },
    "Aoraki Mackenzie": { county: "Canterbury", state: "South Island", country: "New Zealand" },
    "Pic du Midi": { county: "Hautes-Pyrénées", state: "Occitanie", country: "France" },
    "Mont-Mégantic": { county: "Estrie", state: "Quebec", country: "Canada" },
    "Exmoor National Park": { county: "Somerset", state: "England", country: "United Kingdom" },
    "Galloway Forest Park": { county: "Dumfries", state: "Scotland", country: "United Kingdom" },
    "Westhavelland Nature Park": { county: "Brandenburg", state: "Brandenburg", country: "Germany" },
    "Zselic Starry Sky Park": { county: "Somogy", state: "Southern Transdanubia", country: "Hungary" },
    "Jasper National Park": { county: "Alberta", state: "Alberta", country: "Canada" }
  };
  
  return darkSkyLocations.map((location, index) => {
    // Determine certification type
    let certification = '';
    let isDarkSkyReserve = false;
    
    const lowerName = location.name.toLowerCase();
    if (lowerName.includes('reserve')) {
      certification = 'International Dark Sky Reserve';
      isDarkSkyReserve = true;
    } else if (lowerName.includes('park')) {
      certification = 'International Dark Sky Park';
    } else {
      certification = 'International Dark Sky Place';
    }
    
    // Get location details from mapping or provide defaults
    const locationDetails = countryMapping[location.name] || {
      county: "Unknown County",
      state: "Unknown State",
      country: "Unknown Country"
    };
    
    return {
      id: `certified-${index}-${Date.now()}`,
      name: location.name,
      chineseName: `暗夜天空 ${location.name}`,
      latitude: location.coordinates[0],
      longitude: location.coordinates[1],
      bortleScale: location.bortleScale,
      siqs: 9 - location.bortleScale + (Math.random() * 1),
      isViable: true,
      distance: 0, // Calculated when needed
      description: `An officially certified dark sky location designated by the International Dark-Sky Association.`,
      timestamp: new Date().toISOString(),
      isDarkSkyReserve: isDarkSkyReserve,
      certification: certification,
      county: locationDetails.county,
      state: locationDetails.state,
      country: locationDetails.country
    };
  });
};
