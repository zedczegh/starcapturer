
import { GeocodingResult } from '../types/enhancedLocationTypes';
import { formatAddressComponents } from '../formatters/addressFormatter';
import { Language } from '../types';

/**
 * Fetch detailed location information from Nominatim OpenStreetMap API
 * @param latitude Normalized latitude
 * @param longitude Normalized longitude
 * @param language User's preferred language
 * @returns Promise<GeocodingResult | null>
 */
export async function fetchLocationDetails(
  latitude: number,
  longitude: number,
  language: Language
): Promise<GeocodingResult | null> {
  try {
    // Setup promise with timeout to avoid long-running requests
    const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(id);
      return response;
    };
    
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${language}`;
    
    const response = await fetchWithTimeout(
      nominatimUrl, 
      {
        headers: {
          'User-Agent': 'AstroSpotApp/1.0'
        }
      },
      3000 // 3 second timeout for faster response
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.address) {
        const addressComponents: Record<string, string> = {};
        const address = data.address;
        
        // Extract address components - with faster property access
        if (address.road || address.pedestrian || address.footway) {
          addressComponents.street = address.road || address.pedestrian || address.footway;
        }
        
        if (address.village || address.town || address.suburb || address.hamlet) {
          addressComponents.town = address.village || address.town || address.suburb || address.hamlet;
        }
        
        if (address.city) {
          addressComponents.city = address.city;
        }
        
        if (address.county) {
          addressComponents.county = address.county;
        }
        
        if (address.state) {
          addressComponents.state = address.state;
        }
        
        if (address.country) {
          addressComponents.country = address.country;
        }
        
        if (address.postcode) {
          addressComponents.postcode = address.postcode;
        }
        
        return {
          streetName: addressComponents.street,
          townName: addressComponents.town,
          cityName: addressComponents.city,
          countyName: addressComponents.county,
          stateName: addressComponents.state,
          countryName: addressComponents.country,
          postalCode: addressComponents.postcode,
          formattedName: formatAddressComponents(addressComponents, language)
        };
      }
    }
    
    return null;
  } catch (error) {
    console.warn("Error fetching from Nominatim API:", error);
    return null;
  }
}
