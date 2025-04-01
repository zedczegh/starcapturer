import { Location, GeocodeResponse, Language } from './types';
import { findMatchingLocations } from './locationDatabase';
import { findSmallTownMatches } from './smallTownsDatabase';
import { searchCache } from '../caching/searchCache';
import { normalizeLongitude } from '@/lib/api/coordinates';
import { getLocationNameFromCoordinates } from '@/lib/api';
import { chineseLocationDatabase } from './data/chineseLocationData';

/**
 * Search for locations based on user input
 * Enhanced with comprehensive Chinese location database
 * 
 * @param query The search query
 * @param language The current language (en/zh)
 * @returns A promise resolving to an array of matching locations
 */
export async function searchLocations(
  query: string, 
  language: string = 'en'
): Promise<Location[]> {
  // Return empty results for empty or very short queries
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  // Normalize the query string
  const normalizedQuery = query.trim().toLowerCase();
  
  // Check cache first for faster response times
  const cachedResults = searchCache.getCachedResults(normalizedQuery, language as Language);
  if (cachedResults && cachedResults.length > 0) {
    console.log("Returning cached results for", normalizedQuery);
    return cachedResults;
  }
  
  try {
    // Start with our internal database matches
    let internalMatches = findMatchingLocations(normalizedQuery, 10, language as Language);
    
    // Enhanced search for Chinese locations in our database
    if (language === 'zh' || containsChineseCharacters(normalizedQuery)) {
      // Search in our Chinese location database
      const chineseMatches = chineseLocationDatabase
        .filter(loc => 
          loc.district.includes(normalizedQuery) || 
          loc.city.includes(normalizedQuery) || 
          (loc.province.includes(normalizedQuery) && normalizedQuery.length >= 2) ||
          (language === 'en' && (
            loc.nameEn.toLowerCase().includes(normalizedQuery) || 
            loc.pinyin.includes(normalizedQuery)
          ))
        )
        .map(loc => ({
          name: language === 'zh' ? `${loc.district}, ${loc.city}, ${loc.province}` : `${loc.nameEn}, ${loc.city}, China`,
          latitude: loc.latitude,
          longitude: loc.longitude,
          placeDetails: language === 'zh' ? 
            `${loc.province}` : 
            `${loc.nameEn} in ${loc.city}, China`
        }));
      
      // If we found specific Chinese locations, prioritize them
      if (chineseMatches.length > 0) {
        internalMatches = [...chineseMatches, ...internalMatches];
      }
    }
    
    // Only for English language searches, add small town matches
    let smallTownResults: Location[] = [];
    if (language === 'en') {
      smallTownResults = findSmallTownMatches(normalizedQuery);
    }
    
    // Combine all internal results
    let results = [...internalMatches, ...smallTownResults];
    
    // Deduplicate based on name
    results = results.filter((location, index, self) =>
      index === self.findIndex(l => l.name === location.name)
    );
    
    // If we have enough results already, don't need to call external API
    if (results.length >= 5) {
      console.log(`Found ${results.length} locations in internal database, skipping external API call`);
      
      // Cache the results
      if (results.length > 0) {
        searchCache.cacheResults(normalizedQuery, results, language as Language);
      }
      
      return results.slice(0, 10);
    }
    
    // If we don't have enough internal results, proceed with an external API call
    const apiResults = await getExternalLocationResults(normalizedQuery, language as Language);
    
    // Combine with internal results, prioritizing our own data
    results = [...results, ...apiResults.filter(apiLoc => 
      !results.some(intLoc => 
        intLoc.name === apiLoc.name || 
        (Math.abs(intLoc.latitude - apiLoc.latitude) < 0.01 && 
         Math.abs(intLoc.longitude - apiLoc.longitude) < 0.01)
      )
    )];
    
    // Limit to 10 results
    results = results.slice(0, 10);
    
    // Cache the results for future use
    if (results.length > 0) {
      searchCache.cacheResults(normalizedQuery, results, language as Language);
    }
    
    return results;
  } catch (error) {
    console.error("Error searching for locations:", error);
    return [];
  }
}

/**
 * Get location data from external API
 */
async function getExternalLocationResults(
  query: string, 
  language: string = 'en'
): Promise<Location[]> {
  try {
    // We're using our own API to fetch locations
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=${language}`,
      {
        headers: {
          'User-Agent': 'SIQSCalculatorApp'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.map((item: any) => ({
      name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      placeDetails: item.type
    }));
  } catch (error) {
    console.error("Error fetching location data from external API:", error);
    return [];
  }
}

/**
 * Reverse geocode: Get location name from coordinates
 * Enhanced to ensure real location names instead of coordinates
 */
export async function getLocationName(
  latitude: number, 
  longitude: number, 
  language: Language = 'en'
): Promise<string> {
  try {
    // First check our extensive Chinese location database for better results
    if (isInChina(latitude, longitude)) {
      const closestLocation = findClosestChineseLocation(latitude, longitude);
      if (closestLocation) {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          closestLocation.latitude, 
          closestLocation.longitude
        );
        
        // If very close to a known location, use its name directly
        if (distance < 5) { // Within 5 km
          return language === 'zh' 
            ? `${closestLocation.district}, ${closestLocation.city}` 
            : `${closestLocation.nameEn}, ${closestLocation.city}`;
        }
        
        // If reasonably close, use "Near X"
        if (distance < 30) { // Within 30 km
          return language === 'zh' 
            ? `${closestLocation.district}附近` 
            : `Near ${closestLocation.nameEn}`;
        }
      }
    }
    
    // Fall back to standard API call for better name resolution
    try {
      const locationName = await getLocationNameFromCoordinates(latitude, longitude, language);
      
      // If we got a proper location name (not coordinates), return it
      if (locationName && !locationName.includes("°")) {
        if (language === 'zh') {
          // Format Chinese location - keep it simple with just the town name if possible
          const parts = locationName.split('，');
          if (parts.length > 0) {
            // Return just the first part (usually town name) or full name if it's short
            return parts.length > 2 && locationName.length > 20 ? parts[0] : locationName;
          }
        } else {
          // Format English location - extract just the town name if possible
          const parts = locationName.split(',');
          if (parts.length > 0) {
            // Return just the first part (usually town name) or first two parts if short
            return parts.length > 2 ? `${parts[0]}` : locationName;
          }
        }
        return locationName;
      }
    } catch (error) {
      console.error("Error using OpenStreetMap API:", error);
    }
    
    // Fall back to using our database if API call failed or returned coordinates
    try {
      const { findClosestLocation } = await import('../../data/locationDatabase');
      const nearest = findClosestLocation(latitude, longitude);
      
      if (nearest && nearest.name) {
        // Return "Near X" for locations within reasonable distance
        if (nearest.distance <= 50) {
          return language === 'zh' 
            ? `${nearest.name}附近` 
            : `Near ${nearest.name}`;
        }
      }
    } catch (error) {
      console.error("Database fallback failed:", error);
    }
    
    // Last resort: Return a simplified regional name instead of coordinates
    const regionName = getSimplifiedRegionName(latitude, longitude, language);
    return regionName;
  } catch (error) {
    console.error("Error getting location name:", error);
    return language === 'en' 
      ? `Remote location` 
      : `偏远位置`;
  }
}

/**
 * Get a simplified region name when precise location names aren't available
 */
function getSimplifiedRegionName(
  latitude: number, 
  longitude: number, 
  language: Language
): string {
  // China region names by approximate location
  const china = {
    north: language === 'en' ? "Northern China" : "中国北部",
    northeast: language === 'en' ? "Northeast China" : "中国东北",
    east: language === 'en' ? "Eastern China" : "中国东部",
    south: language === 'en' ? "Southern China" : "中国南部",
    central: language === 'en' ? "Central China" : "中国中部",
    west: language === 'en' ? "Western China" : "中国西部",
    northwest: language === 'en' ? "Northwest China" : "中国西北",
    southwest: language === 'en' ? "Southwest China" : "中国西南",
  };
  
  // Simple region determination based on coordinates
  let region;
  if (latitude > 40) {
    if (longitude < 110) region = china.northwest;
    else region = china.northeast;
  } else if (latitude > 30) {
    if (longitude < 105) region = china.west;
    else if (longitude > 118) region = china.east;
    else region = china.central;
  } else {
    if (longitude < 105) region = china.southwest;
    else region = china.south;
  }
  
  return region;
}

/**
 * Find the closest location in our Chinese database
 */
function findClosestChineseLocation(latitude: number, longitude: number): typeof chineseLocationDatabase[0] | null {
  let closestLocation = null;
  let minDistance = Infinity;
  
  for (const location of chineseLocationDatabase) {
    const distance = calculateDistance(
      latitude, 
      longitude, 
      location.latitude, 
      location.longitude
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestLocation = location;
    }
  }
  
  return closestLocation;
}

/**
 * Check if a string contains Chinese characters
 */
export function containsChineseCharacters(str: string): boolean {
  const chineseCharRegex = /[\u4e00-\u9fa5]/;
  return chineseCharRegex.test(str);
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Check if coordinates are in China
 */
function isInChina(latitude: number, longitude: number): boolean {
  // Use the function from chinaBortleData.ts
  const { isInChina } = require('../../utils/chinaBortleData');
  return isInChina(latitude, longitude);
}
