
/**
 * Types for geocoding services
 */

// Language codes for geocoding
export type Language = 'en' | 'zh' | 'zh-CN' | 'zh-TW';

// Location type with coordinates and metadata
export interface Location {
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  type?: string;
  confidence?: number;
}

// Search result type
export interface SearchResult {
  locations: Location[];
  totalCount: number;
  source: string;
}

// Geocoding options
export interface GeocodingOptions {
  language?: Language;
  limit?: number;
  includeDetails?: boolean;
  types?: string[];
}
