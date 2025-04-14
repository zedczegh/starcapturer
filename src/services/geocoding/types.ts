
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
