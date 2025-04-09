
import { useMemo } from 'react';
import { getConsistentSiqsValue } from '@/utils/nighttimeSIQS';
import { formatSIQSScoreForDisplay, getSIQSColorClass } from '@/hooks/siqs/siqsCalculationUtils';

/**
 * A hook to provide consistent SIQS display values
 * @param location The location object with SIQS data
 * @returns Formatted values and styles for the SIQS display
 */
export function useSiqsDisplay(location: any) {
  return useMemo(() => {
    if (!location) {
      return {
        displayScore: '0.0',
        colorClass: 'bg-red-500/80 border-red-400/50',
        isViable: false,
        isNighttimeCalculation: false
      };
    }
    
    // Get the most accurate SIQS value
    const siqsValue = getConsistentSiqsValue(location);
    
    // Check if this is a nighttime calculation
    const isNighttimeCalculation = location.siqsResult?.metadata?.calculationType === 'nighttime' ||
      location.siqsResult?.isNighttimeCalculation === true ||
      (Array.isArray(location.siqsResult?.factors) && 
        location.siqsResult?.factors.some((f: any) => f.nighttimeData));
    
    return {
      displayScore: formatSIQSScoreForDisplay(siqsValue),
      colorClass: getSIQSColorClass(siqsValue),
      isViable: siqsValue >= 5.0,
      isNighttimeCalculation
    };
  }, [location]);
}
