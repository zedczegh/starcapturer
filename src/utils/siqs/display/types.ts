
/**
 * Types for SIQS display functionality
 */

// SIQS display options interface
export interface SiqsDisplayOpts {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | any;
  skipCache?: boolean;
  useSingleHourSampling?: boolean;
  targetHour?: number;
}

// SIQS calculation result
export interface SiqsResult {
  siqs: number;
  loading: boolean;
  formattedSiqs: string;
  colorClass: string;
  source: 'realtime' | 'cached' | 'default';
}
