
// Define types related to geocoding service

export type Language = "en" | "zh";

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  administrativeArea?: string;
  country?: string;
  formattedAddress?: string;
  placeDetails?: string;
  chineseName?: string;
}

export interface GeocodingOptions {
  cache?: boolean;
  timeout?: number;
}

export interface CacheService {
  getCachedData: (key: string) => Promise<any>;
  setCachedData: (key: string, data: any, ttl?: number) => Promise<void>;
}

// Add missing types that are referenced in other files
export interface CityAlternative {
  name: string;
  chinese: string;
  alternatives: string[];
  coordinates: [number, number]; // [latitude, longitude]
  placeDetails?: string;
}

export interface ChineseLocation {
  // Required fields
  name: string;
  chinese: string;
  pinyin: string;
  longitude: number;
  latitude: number;
  
  // Optional fields
  bortleScale?: number;
  type?: string;
  areaCode?: string;
  provinceCode?: string;
  province?: string;
  cityCode?: string;
  city?: string;
  districtCode?: string;
  district?: string;
  nameEn?: string;
  coordinates?: [number, number];
}

// Add a shared interface for geocoding responses
export interface GeocodeResponse {
  locations: Location[];
  source: string;
}
