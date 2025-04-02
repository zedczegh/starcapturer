
export interface SharedAstroSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  bortleScale?: number | null;
  distance?: number;
  certification?: string;
  isDarkSkyReserve?: boolean;
  isDarkSkyPark?: boolean;
  isDarkSkySanctuary?: boolean;
  type?: 'urban' | 'rural' | 'dark-site' | 'natural' | 'suburban';
  chineseName?: string;
  description?: string;
  timestamp?: string;
  siqs?: number;
  isViable?: boolean;
  siqsFactors?: any[];
}
