
import React from 'react';

export interface RealTimeSiqsProviderProps {
  isVisible: boolean;
  latitude?: number;
  longitude?: number;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | any;
  onSiqsCalculated: (siqs: number | null, loading: boolean, confidence?: number) => void;
  forceUpdate?: boolean;
}

export interface QueueProcessorProps {
  processQueue: () => void;
}

// Memory-efficient result cache type
export type CacheEntry = {
  data: any;
  timestamp: number;
};
