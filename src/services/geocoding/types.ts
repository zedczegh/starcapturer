
/**
 * Supported languages for geocoding services
 */
export type Language = 'en' | 'zh';

/**
 * Basic location information
 */
export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  placeDetails?: string; // Added the placeDetails property
}

/**
 * Extended location with detailed naming and hierarchy
 */
export interface DetailedLocation extends Location {
  streetName?: string;
  townName?: string;
  cityName?: string;
  countyName?: string;
  stateName?: string;
  countryName?: string;
  distance?: number;
}

/**
 * City with alternative names and spellings
 */
export interface CityAlternative {
  name: string;
  chinese: string;
  alternatives: string[];
  coordinates: [number, number];
  placeDetails?: string;
}

/**
 * Chinese location with additional metadata
 */
export interface ChineseLocation {
  name: string;
  chineseName: string;
  coordinates: [number, number];
  region?: string;
  province?: string;
  placeDetails?: string;
}

/**
 * Response structure for geocoding services
 */
export interface GeocodeResponse {
  results: Location[];
  status: 'OK' | 'ZERO_RESULTS' | 'ERROR';
  error?: string;
}

/**
 * Enhanced location details from reverse geocoding
 */
export interface EnhancedLocationDetails {
  formattedName?: string;
  streetName?: string;
  townName?: string;
  cityName?: string;
  countyName?: string;
  stateName?: string;
  countryName?: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}
