
export * from './coordinateValidator';
export * from './waterLocationValidator';
export * from './astronomyLocationValidator';

// Re-export certification check for backward compatibility
import { SharedAstroSpot } from '@/lib/api/astroSpots';
export const isCertifiedLocation = (location: SharedAstroSpot): boolean => {
  return Boolean(location?.isDarkSkyReserve || 
    (location?.certification && location.certification !== ''));
};
