import { supabase } from '@/integrations/supabase/client';

export interface Country {
  id: string;
  code: string;
  name: string;
  name_zh?: string;
  flag_emoji: string;
}

// Cache for country data
let countriesCache: Country[] | null = null;
let countriesByCodeCache: Map<string, Country> | null = null;

/**
 * Fetch all countries from database
 */
export async function getAllCountries(): Promise<Country[]> {
  if (countriesCache) {
    return countriesCache;
  }

  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching countries:', error);
    return [];
  }

  countriesCache = data || [];
  
  // Build code lookup map
  countriesByCodeCache = new Map();
  countriesCache.forEach(country => {
    countriesByCodeCache!.set(country.code.toUpperCase(), country);
  });
  
  return countriesCache;
}

/**
 * Get country code from coordinates using reverse geocoding with retry
 */
export async function getCountryFromCoordinates(
  latitude: number,
  longitude: number,
  retryCount: number = 0
): Promise<string | null> {
  const maxRetries = 2;
  const retryDelay = 1000 * (retryCount + 1); // Progressive delay
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=3`,
      {
        headers: {
          'User-Agent': 'StarCaptureApp/1.0',
          'Accept': 'application/json'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429 && retryCount < maxRetries) {
        // Rate limited, retry with delay
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return getCountryFromCoordinates(latitude, longitude, retryCount + 1);
      }
      return null;
    }

    const data = await response.json();
    const countryCode = data?.address?.country_code?.toUpperCase();
    
    return countryCode || null;
  } catch (error: any) {
    if (error.name === 'AbortError' && retryCount < maxRetries) {
      // Timeout, retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return getCountryFromCoordinates(latitude, longitude, retryCount + 1);
    }
    console.error('Error getting country from coordinates:', error);
    return null;
  }
}

/**
 * Get country by country code (optimized with cache)
 */
export async function getCountryByCode(code: string): Promise<Country | null> {
  // Ensure cache is loaded
  if (!countriesByCodeCache) {
    await getAllCountries();
  }
  
  return countriesByCodeCache?.get(code.toUpperCase()) || null;
}

/**
 * Get country flag and name from coordinates
 */
export async function getCountryInfoFromCoordinates(
  latitude: number,
  longitude: number
): Promise<{ flag: string; name: string; name_zh?: string } | null> {
  const countryCode = await getCountryFromCoordinates(latitude, longitude);
  
  if (!countryCode) {
    return null;
  }

  const country = await getCountryByCode(countryCode);
  
  if (!country) {
    return null;
  }

  return {
    flag: country.flag_emoji,
    name: country.name,
    name_zh: country.name_zh
  };
}
