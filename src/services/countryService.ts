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

// Request queue to prevent overwhelming Nominatim API
interface QueuedRequest {
  latitude: number;
  longitude: number;
  resolve: (value: string | null) => void;
  reject: (error: any) => void;
}

let requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests to respect rate limits

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (!request) break;
    
    try {
      const result = await fetchCountryCodeDirectly(request.latitude, request.longitude);
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    }
    
    // Wait before processing next request
    if (requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL));
    }
  }
  
  isProcessingQueue = false;
}

async function fetchCountryCodeDirectly(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
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
      return null;
    }

    const data = await response.json();
    const countryCode = data?.address?.country_code?.toUpperCase();
    
    return countryCode || null;
  } catch (error: any) {
    console.error('Error fetching country code:', error);
    return null;
  }
}

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
 * Get country code from coordinates using queued requests
 */
export async function getCountryFromCoordinates(
  latitude: number,
  longitude: number
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    requestQueue.push({ latitude, longitude, resolve, reject });
    processQueue();
  });
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
