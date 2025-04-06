
/**
 * Types for geocoding services
 */

export type Language = 'en' | 'zh';

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  confidence: number;
  country?: string;
  region?: string;
  city?: string;
}

export interface ReverseGeocodingResult {
  name: string;
  address: {
    country?: string;
    state?: string;
    county?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    hamlet?: string;
    postcode?: string;
  };
  latitude: number;
  longitude: number;
}
