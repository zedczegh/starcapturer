
export interface SharedAstroSpot {
  id?: string;
  name?: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  bortleScale?: number;
  siqs?: number;
  isDarkSkyReserve?: boolean;
  certification?: string;
  isViable?: boolean;
  siqsResult?: {
    score: number;
    isViable: boolean;
    factors?: Array<any>;
  };
}
