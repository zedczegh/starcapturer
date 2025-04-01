/**
 * Service for efficiently retrieving Dark Sky locations
 * Provides optimized access to the dark sky locations database
 */

import { locationDatabase, LocationEntry } from '@/data/locationDatabase';
import { calculateDistance } from '@/lib/api/coordinates';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { internationalDarkSkyLocations } from '@/data/regions/internationalDarkSkyLocations';
import { darkSkyLocations } from '@/data/regions/darkSkyLocations';
import { getCachedLocationSearch, cacheLocationSearch } from './locationCacheService';

// Cache of dark sky locations for quick access
let cachedDarkSkyLocations: LocationEntry[] | null = null;

// Cache key for dark sky locations
const DARK_SKY_CACHE_KEY = 'dark-sky-locations-all';

/**
 * Get all dark sky locations from the database
 * @returns Array of LocationEntry with type 'dark-site'
 */
export function getAllDarkSkyLocations(): LocationEntry[] {
  if (!cachedDarkSkyLocations) {
    try {
      // Combine default dark sky locations with international ones
      const allDarkSkyLocations = [
        ...darkSkyLocations,
        ...internationalDarkSkyLocations,
        ...locationDatabase.filter(loc => loc.type === 'dark-site')
      ];
      
      // Remove duplicates based on coordinates
      const uniqueLocations = removeDuplicateLocations(allDarkSkyLocations);
      
      cachedDarkSkyLocations = uniqueLocations;
      console.log(`Loaded ${cachedDarkSkyLocations.length} unique dark sky locations`);
    } catch (error) {
      console.error("Error loading dark sky locations:", error);
      return [];
    }
  }
  return cachedDarkSkyLocations || [];
}

/**
 * Remove duplicate locations based on coordinates
 * @param locations Array of locations to deduplicate
 * @returns Deduplicated array of locations
 */
function removeDuplicateLocations(locations: LocationEntry[]): LocationEntry[] {
  const uniqueMap = new Map<string, LocationEntry>();
  
  locations.forEach(location => {
    // Create a key based on rounded coordinates
    const lat = Math.round(location.coordinates[0] * 100) / 100;
    const lng = Math.round(location.coordinates[1] * 100) / 100;
    const key = `${lat},${lng}`;
    
    // Only add if no location exists at these coordinates or if this one has a better Bortle scale
    if (!uniqueMap.has(key) || uniqueMap.get(key)!.bortleScale > location.bortleScale) {
      uniqueMap.set(key, location);
    }
  });
  
  return Array.from(uniqueMap.values());
}

/**
 * Find dark sky locations within a radius
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @returns Array of LocationEntry within radius
 */
export function findDarkSkyLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radius: number
): LocationEntry[] {
  // Generate cache key
  const cacheKey = `dark-sky-radius-${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
  
  // Check cache first
  const cachedResult = getCachedLocationSearch(latitude, longitude, radius, cacheKey);
  if (cachedResult) {
    // We need to convert from SharedAstroSpot back to LocationEntry
    return cachedResult.map(spot => ({
      name: spot.name,
      coordinates: [spot.latitude, spot.longitude] as [number, number],
      bortleScale: spot.bortleScale,
      radius: 40, // Default radius
      type: 'dark-site'
    }));
  }
  
  try {
    const darkSkyLocations = getAllDarkSkyLocations();
    
    const locationsInRadius = darkSkyLocations.filter(location => {
      try {
        const distance = calculateDistance(
          latitude,
          longitude,
          location.coordinates[0],
          location.coordinates[1]
        );
        
        return distance <= radius;
      } catch (error) {
        console.error(`Error calculating distance for location ${location.name}:`, error);
        return false;
      }
    });
    
    return locationsInRadius;
  } catch (error) {
    console.error("Error finding dark sky locations within radius:", error);
    return [];
  }
}

/**
 * Categorize dark sky locations by certification type
 * @param location The location name
 * @returns The certification type
 */
function categorizeDarkSkyLocation(location: string): string {
  const lowerName = location.toLowerCase();
  
  if (lowerName.includes('sanctuary')) {
    return 'International Dark Sky Sanctuary';
  } else if (lowerName.includes('reserve')) {
    return 'International Dark Sky Reserve';
  } else if (lowerName.includes('community') || 
            lowerName.includes('village') || 
            lowerName.includes('town') ||
            lowerName.includes('city')) {
    return 'International Dark Sky Community';
  } else if (lowerName.includes('urban')) {
    return 'Urban Night Sky Place';
  } else {
    // Default to park for national parks, state parks, etc.
    return 'International Dark Sky Park';
  }
}

/**
 * Create a description for a dark sky location
 * @param name Location name
 * @param bortleScale Bortle scale value
 * @param certification Certification type
 * @returns Description string
 */
function createLocationDescription(name: string, bortleScale: number, certification: string): string {
  let description = `${name} is a recognized dark sky location `;
  
  if (certification.includes('Sanctuary')) {
    description += "offering pristine skies in a remote area with exceptional stargazing conditions";
  } else if (certification.includes('Reserve')) {
    description += "that combines natural darkness with coordinated lighting policies for outstanding astronomical viewing";
  } else if (certification.includes('Park')) {
    description += "where visitors can enjoy protected night skies for astronomy and nocturnal wildlife observation";
  } else if (certification.includes('Community')) {
    description += "that has implemented lighting ordinances to protect the night sky while maintaining a livable community";
  } else if (certification.includes('Urban')) {
    description += "that demonstrates excellent stewardship of the night sky despite urban challenges";
  }
  
  description += ` (Bortle scale ${bortleScale}).`;
  
  return description;
}

/**
 * Convert LocationEntry to SharedAstroSpot format
 * @param entry LocationEntry from database
 * @param userLatitude User latitude for distance calculation
 * @param userLongitude User longitude for distance calculation
 * @returns SharedAstroSpot object
 */
export function convertToSharedAstroSpot(
  entry: LocationEntry,
  userLatitude: number,
  userLongitude: number
): SharedAstroSpot {
  try {
    const distance = calculateDistance(
      userLatitude,
      userLongitude,
      entry.coordinates[0],
      entry.coordinates[1]
    );
    
    const certification = categorizeDarkSkyLocation(entry.name);
    const isDarkSkyReserve = certification.includes('Reserve');
    const description = createLocationDescription(entry.name, entry.bortleScale, certification);
    
    // Calculate a realistic SIQS score based on Bortle scale
    const siqs = calculateSiqsFromBortleScale(entry.bortleScale);
    
    return {
      id: `dark-sky-${entry.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: entry.name,
      latitude: entry.coordinates[0],
      longitude: entry.coordinates[1],
      siqs: siqs,
      bortleScale: entry.bortleScale,
      isDarkSkyReserve,
      certification: certification,
      description: description,
      distance: distance,
      cloudCover: 0, // Will be calculated by SIQS service
      timestamp: new Date().toISOString(),
      isViable: true
    };
  } catch (error) {
    console.error(`Error converting location entry to AstroSpot: ${entry.name}`, error);
    
    // Return a minimal valid SharedAstroSpot object as fallback with required properties
    return {
      id: `dark-sky-${entry.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: entry.name,
      latitude: entry.coordinates[0],
      longitude: entry.coordinates[1],
      bortleScale: entry.bortleScale || 5, // Provide a default value
      siqs: 0, // Default SIQS
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Calculate SIQS (Sky Quality Score) from Bortle scale
 * @param bortleScale Bortle scale value (1-9)
 * @returns SIQS value (1-10)
 */
function calculateSiqsFromBortleScale(bortleScale: number): number {
  // Dark Sky locations tend to have excellent sky quality
  const baseSiqs = 10 - bortleScale;
  
  // Add some variability but keep scores high for certified locations
  // Lower Bortle scales (darker skies) get higher SIQS values
  if (bortleScale <= 2) {
    // For very dark skies (Bortle 1-2), SIQS should be 8-10
    return Math.max(8, Math.min(10, baseSiqs + (Math.random() * 1)));
  } else if (bortleScale <= 4) {
    // For good skies (Bortle 3-4), SIQS should be 6-8
    return Math.max(6, Math.min(8, baseSiqs + (Math.random() * 1.2)));
  } else {
    // For moderate to poor skies, use base calculation
    return Math.max(1, Math.min(6, baseSiqs + (Math.random() * 1.5 - 0.5)));
  }
}

/**
 * Get dark sky locations as SharedAstroSpot objects
 * @param latitude User latitude
 * @param longitude User longitude
 * @param radius Search radius in km
 * @returns Array of SharedAstroSpot
 */
export function getDarkSkyAstroSpots(
  latitude: number,
  longitude: number,
  radius: number
): SharedAstroSpot[] {
  try {
    // Check cache first
    const cacheKey = `dark-sky-astro-${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
    const cachedSpots = getCachedLocationSearch(latitude, longitude, radius, cacheKey);
    
    if (cachedSpots) {
      return cachedSpots;
    }
    
    // If not in cache, calculate
    const locations = findDarkSkyLocationsWithinRadius(latitude, longitude, radius);
    
    const astroSpots = locations.map(location => 
      convertToSharedAstroSpot(location, latitude, longitude)
    );
    
    // Sort by distance
    const sortedSpots = astroSpots.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    // Cache the results with extended expiration (these are static locations)
    cacheLocationSearch(latitude, longitude, radius, sortedSpots, cacheKey, true);
    
    return sortedSpots;
  } catch (error) {
    console.error("Error getting dark sky astro spots:", error);
    return [];
  }
}
