
import { SIQSResult } from '@/lib/siqs/types';

/**
 * SharedAstroSpot interface unified across the application
 */
export interface SharedAstroSpot {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  description?: string;
  imageURL?: string;
  rating?: number;
  timestamp?: string;
  chineseName?: string;
  siqs?: number;
  siqsResult?: SIQSResult;
  siqsFactors?: any[];
  distance?: number;
  isViable?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
  weatherData?: any;
  cloudCover?: number;
}

/**
 * Type guard to check if an object is a SharedAstroSpot
 */
export function isSharedAstroSpot(obj: any): obj is SharedAstroSpot {
  return obj && 
    typeof obj === 'object' && 
    typeof obj.name === 'string' && 
    typeof obj.latitude === 'number' && 
    typeof obj.longitude === 'number';
}
