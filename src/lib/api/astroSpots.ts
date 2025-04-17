
/**
 * Shared location data structure used across the application
 */
export interface SharedAstroSpot {
  id?: string;
  name?: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  description?: string;
  bortleScale?: number;
  siqs?: number | { score: number; isViable: boolean };
  siqsResult?: any;
  distance?: number;
  timestamp?: string;
  date?: string;
  lastVisit?: string;
  isDarkSkyReserve?: boolean;
  certification?: string;
  image?: string;
  [key: string]: any; // Allow arbitrary additional properties
}
