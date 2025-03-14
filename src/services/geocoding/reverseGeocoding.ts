
import { Language } from './types';
import { normalizeLongitude } from '@/lib/api/coordinates';

/**
 * Enhanced function to get location name from coordinates
 * Now with better name resolution for places beyond Beijing and Hong Kong
 */
export async function getLocationNameFromCoordinates(
  latitude: number, 
  longitude: number,
  language: Language = 'en'
): Promise<string> {
  try {
    // Normalize coordinates
    const validLat = Math.max(-90, Math.min(90, latitude));
    const validLng = normalizeLongitude(longitude);
    
    // First try open API for reverse geocoding
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${validLat}&lon=${validLng}&format=json&accept-language=${language}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SIQSCalculatorApp'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          // Extract the most relevant part (city or region)
          const parts = data.display_name.split(',');
          const cityOrRegion = parts.length > 1 ? parts[0].trim() : data.display_name;
          
          return cityOrRegion;
        }
      }
    } catch (error) {
      console.error("Error using Nominatim API:", error);
    }
    
    // Fallback to our database
    const { findClosestKnownLocation } = await import('@/utils/locationUtils');
    const closestLocation = findClosestKnownLocation(validLat, validLng);
    
    // If we're close to a known location, use its name or "Near X"
    if (closestLocation.distance <= 20) {
      return closestLocation.name;
    } else if (closestLocation.distance <= 100) {
      return language === 'en' 
        ? `Near ${closestLocation.name}` 
        : `${closestLocation.name}附近`;
    }
    
    // Last resort - use major city or region names based on approximate location
    const china = {
      north: ["Beijing Region", "北京地区"],
      northeast: ["Northeast China", "中国东北"],
      east: ["East China", "中国东部"],
      south: ["South China", "中国南部"],
      central: ["Central China", "中国中部"],
      west: ["Western China", "中国西部"],
      northwest: ["Northwest China", "中国西北"],
      southwest: ["Southwest China", "中国西南"],
    };
    
    // Simple region determination based on coordinates
    let region;
    if (validLat > 40) {
      if (validLng < 110) region = china.northwest;
      else region = china.northeast;
    } else if (validLat > 30) {
      if (validLng < 105) region = china.west;
      else if (validLng > 118) region = china.east;
      else region = china.central;
    } else {
      if (validLng < 105) region = china.southwest;
      else region = china.south;
    }
    
    return language === 'en' ? region[0] : region[1];
  } catch (error) {
    console.error('Error getting location name:', error);
    return language === 'en' 
      ? `Location at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°` 
      : `位置在 ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  }
}
