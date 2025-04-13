
// SharedAstroSpot type definition with all required properties
export interface SharedAstroSpot {
  id?: string;
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  bortleScale?: number;
  siqs?: number;
  isViable?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
  date?: string;
  timestamp?: string;
  factors?: any[]; // For storing SIQS calculation factors
}
