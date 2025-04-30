
export interface EnhancedLocationDetails {
  name: string;
  displayName?: string;
  formattedName?: string; // Added back for backwards compatibility
  chineseName?: string;
  streetName?: string;
  townName?: string;
  cityName?: string;
  countyName?: string;
  stateName?: string;
  countryName?: string;
  address: string;
  country: string;
  countryCode: string;
  region: string;
  postalCode?: string;
  distance?: number;
  formattedDistance?: string;
  detailedName?: string;
  citySize?: 'urban' | 'suburban' | 'rural' | 'remote' | string;
  isWater: boolean;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  timezone: string;
  population?: number;
  elevation?: number;
  landUse?: string;
  accuracyScore?: number;
}

export interface ReverseGeocodingResponse {
  status: 'success' | 'error';
  message?: string;
  data?: EnhancedLocationDetails;
}

// Added back for backwards compatibility
export interface GeocodingResult {
  streetName?: string;
  townName?: string;
  cityName?: string;
  countyName?: string;
  stateName?: string;
  countryName?: string;
  postalCode?: string;
  formattedName?: string;
  chineseName?: string;
  name?: string;
}
