// Define the common types used across geocoding services

/** Location interface representing a geographic location with coordinates */
export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  placeDetails?: string;
}

/** Type for supported languages */
export type Language = 'en' | 'zh';

/**
 * Structure for Chinese city alternatives
 */
export interface CityAlternative {
  name: string;
  chinese: string;
  alternatives: string[];
  coordinates: [number, number];
  placeDetails?: string;
}
