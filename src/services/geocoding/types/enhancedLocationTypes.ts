
export interface EnhancedLocationDetails {
  name: string;
  displayName?: string;
  address: string;
  country: string;
  countryCode: string;
  region: string;
  citySize?: 'urban' | 'suburban' | 'rural' | string;
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
