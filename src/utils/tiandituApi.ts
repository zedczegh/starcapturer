
/**
 * Location services utilities
 */
import { findClosestKnownLocation, locationDatabase } from "./bortleScaleEstimation";

// Tianditu requires an API key (we use a public test key - replace with your own in production)
const TIANDITU_KEY = "1f2df41008fa6dca06da53a1422935f5";

/**
 * Get location name from coordinates (reverse geocoding)
 * This now uses our local database first, with Tianditu as a fallback
 */
export async function getTiandituLocationName(
  latitude: number,
  longitude: number,
  language: string = 'en'
): Promise<string> {
  try {
    // For safety, ensure coordinates are valid numbers
    if (!isFinite(latitude) || !isFinite(longitude)) {
      return getFormattedLocationString(latitude || 0, longitude || 0);
    }
    
    // Ensure coordinates are within valid ranges
    const validLat = Math.max(-90, Math.min(90, latitude));
    const validLng = ((longitude + 180) % 360 + 360) % 360 - 180;
    
    // First, check our local database for a close match
    const closestLocation = findClosestKnownLocation(validLat, validLng);
    
    // If we found a location within 20km, use its name
    if (closestLocation.distance <= 20) {
      console.log(`Using location from database: ${closestLocation.name} (${closestLocation.distance.toFixed(2)}km away)`);
      return closestLocation.name;
    }
    
    const langCode = language === 'zh' ? 'c' : 'e'; // c for Chinese, e for English
    
    console.log(`Attempting Tianditu API for reverse geocoding at: ${validLat}, ${validLng}`);
    
    try {
      const response = await fetch(
        `https://api.tianditu.gov.cn/geocoder?postStr={'lon':${validLng},'lat':${validLat},'ver':1}&type=geocode&tk=${TIANDITU_KEY}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          cache: 'no-cache',
          // Shorter timeout to fail faster if API is unavailable
          signal: AbortSignal.timeout(5000)
        }
      );
      
      if (!response.ok) {
        console.warn('Tianditu API response not OK:', response.status, response.statusText);
        // If our local database found something but just not very close, use it anyway
        if (closestLocation.name) {
          return `${closestLocation.name} area`;
        }
        return getFormattedLocationString(validLat, validLng);
      }
      
      const data = await response.json();
      console.log('Tianditu geocoding response:', data);
      
      if (data.status === '0' && data.result) {
        // Format the response based on the data structure
        const addressComponent = data.result.addressComponent;
        
        if (addressComponent) {
          const parts = [];
          
          // Add city or county
          if (addressComponent.city) {
            parts.push(addressComponent.city);
          } else if (addressComponent.county) {
            parts.push(addressComponent.county);
          }
          
          // Add province
          if (addressComponent.province && !parts.includes(addressComponent.province)) {
            parts.push(addressComponent.province);
          }
          
          // Add country if different from province and city
          if (addressComponent.country && 
              addressComponent.country !== addressComponent.province && 
              addressComponent.country !== parts[0]) {
            parts.push(addressComponent.country);
          }
          
          if (parts.length > 0) {
            return parts.join(', ');
          }
        }
        
        // Fallback to formatted address
        if (data.result.formatted_address) {
          return data.result.formatted_address;
        }
      }
    } catch (apiError) {
      console.warn('Error with Tianditu API call:', apiError);
      // If our local database found something but just not very close, use it anyway
      if (closestLocation.name) {
        return `${closestLocation.name} area`;
      }
    }
    
    // If we reach here, API failed or returned invalid data
    return getFormattedLocationString(validLat, validLng);
  } catch (error) {
    console.error('Error getting location name from Tianditu:', error);
    // Safe fallback even if all coordinates are invalid
    return getFormattedLocationString(latitude || 0, longitude || 0);
  }
}

/**
 * Generate a formatted location string based on coordinates
 */
function getFormattedLocationString(latitude: number, longitude: number): string {
  return `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
}

/**
 * Search for locations by name
 * This now uses our local database first, with Tianditu as a fallback
 */
export async function searchTiandituLocations(
  query: string,
  language: string = 'en'
): Promise<Array<{
  name: string;
  placeDetails: string;
  latitude: number;
  longitude: number;
}>> {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  try {
    const lowercaseQuery = query.toLowerCase();
    
    // First search our local database
    const matchingLocations = locationDatabase
      .filter(location => 
        location.name.toLowerCase().includes(lowercaseQuery)
      )
      .map(location => ({
        name: location.name,
        placeDetails: `${location.name}, Bortle Scale: ${location.bortleScale.toFixed(1)}`,
        latitude: location.coordinates[0],
        longitude: location.coordinates[1]
      }));
    
    // If we have enough matches from our database, return them
    if (matchingLocations.length >= 3) {
      return matchingLocations.slice(0, 8); // Limit to 8 results for better UI
    }
    
    // If not enough results, try the Tianditu API
    const langCode = language === 'zh' ? 'c' : 'e'; // c for Chinese, e for English
    
    console.log(`Searching Tianditu locations for: ${query}`);
    
    try {
      const response = await fetch(
        `https://api.tianditu.gov.cn/search?postStr={'keyWord':'${encodeURIComponent(query)}','level':12,'mapBound':'73.66,3.86,135.05,53.55','queryType':1,'start':0,'count':10}&type=query&tk=${TIANDITU_KEY}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        }
      );
      
      if (!response.ok) {
        console.warn('Tianditu search API response not OK:', response.status, response.statusText);
        return matchingLocations.length > 0 ? matchingLocations : getFallbackSearchResults(query);
      }
      
      const data = await response.json();
      console.log('Tianditu search response:', data);
      
      if (data.status === '0' && data.pois && data.pois.length > 0) {
        // Map the response to our expected format
        const apiResults = data.pois.map((poi: any) => ({
          name: poi.name || 'Unknown Location',
          placeDetails: poi.address || poi.name || 'Unknown Location',
          latitude: parseFloat(poi.pointY),
          longitude: parseFloat(poi.pointX)
        }));
        
        // Combine our database results with API results, removing duplicates
        const combinedResults = [...matchingLocations];
        
        for (const apiResult of apiResults) {
          // Only add if we don't already have this location
          if (!combinedResults.some(loc => loc.name === apiResult.name)) {
            combinedResults.push(apiResult);
          }
        }
        
        return combinedResults.slice(0, 8); // Limit to 8 results
      }
      
      return matchingLocations.length > 0 ? matchingLocations : getFallbackSearchResults(query);
    } catch (apiError) {
      console.warn('Error with Tianditu search API call:', apiError);
      return matchingLocations.length > 0 ? matchingLocations : getFallbackSearchResults(query);
    }
  } catch (error) {
    console.error('Error searching locations with Tianditu:', error);
    return getFallbackSearchResults(query);
  }
}

/**
 * Get some fallback search results for when the API fails
 */
function getFallbackSearchResults(query: string): Array<{
  name: string;
  placeDetails: string;
  latitude: number;
  longitude: number;
}> {
  // Default locations when everything fails
  const commonLocations = [
    { name: "Beijing", placeDetails: "Beijing, China", latitude: 39.9042, longitude: 116.4074 },
    { name: "Hong Kong", placeDetails: "Hong Kong SAR", latitude: 22.3193, longitude: 114.1694 },
    { name: "Tokyo", placeDetails: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503 },
    { name: "Shanghai", placeDetails: "Shanghai, China", latitude: 31.2304, longitude: 121.4737 }
  ];
  
  // Try to find locations that match the query
  const matchingLocations = commonLocations.filter(location => 
    location.name.toLowerCase().includes(query.toLowerCase())
  );
  
  return matchingLocations.length > 0 ? matchingLocations : [commonLocations[0]];
}
