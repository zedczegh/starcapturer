
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
 */
export async function getLocationName(
  latitude: number, 
  longitude: number, 
  language: Language = 'en'
): Promise<string> {
  try {
    // First check our extensive Chinese location database
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
        if (distance < 20) { // Within 20 km
          return language === 'zh' 
            ? `${closestLocation.district}附近, ${closestLocation.city}` 
            : `Near ${closestLocation.nameEn}, ${closestLocation.city}`;
        }
      }
    }
    
    // Fall back to standard API call
    return await getLocationNameFromCoordinates(latitude, longitude, language);
  } catch (error) {
    console.error("Error getting location name:", error);
    return language === 'en' 
      ? `Location at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°` 
      : `位置在 ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  }
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
