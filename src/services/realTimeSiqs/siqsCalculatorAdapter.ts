
import { calculateRealTimeSiqs } from './siqsCalculator';

// This adapter function bridges the API between the old calculateSiqs function
// expected by RealTimeSiqsProvider and the new calculateRealTimeSiqs implementation
export function calculateSiqs(
  latitude: number,
  longitude: number,
  bortleScale?: number,
  options?: {
    priority?: 'high' | 'normal';
    useCache?: boolean;
    fallbackToExisting?: boolean;
  }
): Promise<{ score: number; confidence?: number; isViable?: boolean } | null> {
  // Map old options to new options format
  const calcOptions = {
    useSingleHourSampling: true,
    cacheDurationMins: options?.priority === 'high' ? 5 : 15,
  };

  return calculateRealTimeSiqs(latitude, longitude, bortleScale || 4, calcOptions)
    .then(result => {
      if (result && result.siqs > 0) {
        return {
          score: result.siqs,
          confidence: result.metadata?.reliability?.score || 7,
          isViable: result.isViable
        };
      }
      return null;
    })
    .catch(error => {
      console.error('Error in calculateSiqs adapter:', error);
      return null;
    });
}
