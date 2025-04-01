
/**
 * Shared types for astro photography spots
 */

export interface SharedAstroSpot {
  id: string;
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  siqs?: number;
  isViable?: boolean;
  distance?: number;
  isDarkSkyReserve?: boolean;
  certification?: string;
  timestamp?: string;
  county?: string;
  state?: string;
  country?: string;
  description?: string;
}

export interface AstroSpotQueryOptions {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
  certifiedOnly?: boolean;
}
