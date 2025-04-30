
// If the file doesn't exist, we'll create it with the necessary type definitions
export interface SharedAstroSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  username?: string;
  bortleScale?: number;
  siqs?: number | null;
  certification?: string;
  isDarkSkyReserve?: boolean;
  default_price?: number;
  currency?: string;
}
