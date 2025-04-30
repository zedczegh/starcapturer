
/**
 * Enhanced response from reverse geocoding including detailed address components
 */
export interface EnhancedLocationDetails {
  name: string;
  formattedName: string;
  chineseName?: string;  // Add Chinese name property
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
  displayName?: string;
  isWater?: boolean; // Flag to indicate if location is in water
  citySize?: 'urban' | 'suburban' | 'rural' | 'remote'; // Add city size property
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
  chineseName?: string;  // Add Chinese name property for raw results too
}
