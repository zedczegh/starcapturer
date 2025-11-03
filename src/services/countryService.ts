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
  return countriesCache;
}

/**
 * Get country code from coordinates using reverse geocoding
 */
export async function getCountryFromCoordinates(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=3`,
      {
        headers: {
          'User-Agent': 'StarCaptureApp/1.0',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.address?.country_code?.toUpperCase() || null;
  } catch (error) {
    console.error('Error getting country from coordinates:', error);
    return null;
  }
}

/**
 * Get country by country code
 */
export async function getCountryByCode(code: string): Promise<Country | null> {
  const countries = await getAllCountries();
  return countries.find(c => c.code === code.toUpperCase()) || null;
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
