
/**
 * Enhanced response from reverse geocoding including detailed address components
 */
export interface EnhancedLocationDetails {
  name: string;
  formattedName: string;
  streetName?: string;
  townName?: string;
  cityName?: string;
  countyName?: string;
  stateName?: string;
  countryName?: string;
  postalCode?: string;
  distance?: number;
  formattedDistance?: string;
  latitude: number;
  longitude: number;
  detailedName?: string;
  isWater?: boolean; // Flag to indicate if location is in water
}

/**
 * Raw geocoding result from providers
 */
export interface GeocodingResult {
  streetName?: string;
  townName?: string;
  cityName?: string;
  countyName?: string;
  stateName?: string;
  countryName?: string;
  postalCode?: string;
  formattedName?: string;
}
