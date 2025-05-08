
// Define types related to geocoding service

export type Language = "en" | "zh";

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  administrativeArea?: string;
  country?: string;
  formattedAddress?: string;
}

export interface GeocodingOptions {
  cache?: boolean;
  timeout?: number;
}

export interface CacheService {
  getCachedData: (key: string) => Promise<any>;
  setCachedData: (key: string, data: any, ttl?: number) => Promise<void>;
}
