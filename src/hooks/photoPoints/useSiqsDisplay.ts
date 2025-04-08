
import { useMemo } from 'react';
import { getConsistentSiqsValue } from '@/utils/nighttimeSIQS';
import { getProgressColor } from '@/components/siqs/utils/progressColor';

/**
 * A hook to provide consistent SIQS display values and styling
 * @param location The location object with SIQS data
 * @returns Formatted values and styles for the SIQS display
 */
export function useSiqsDisplay(location: any) {
  return useMemo(() => {
    if (!location) {
      return {
        displayScore: '0.0',
        scoreValue: 0,
        colorClass: 'text-red-500',
        badgeColor: '#ef4444',
        badgeBgColor: 'rgba(239, 68, 68, 0.15)',
        isViable: false,
        isNighttimeCalculation: false
      };
    }
    
    // Get the most accurate SIQS value
    const siqsValue = getConsistentSiqsValue(location);
    const scoreValue = Math.max(0, Math.min(10, siqsValue)); // Ensure value is between 0-10
    
    // Format score with one decimal place
    const displayScore = scoreValue.toFixed(1);
    
    // Get appropriate color based on score
    const badgeColor = getProgressColor(scoreValue);
    const badgeBgColor = `${badgeColor}20`;
    
    // Check if this is a nighttime calculation
    const isNighttimeCalculation = location.siqsResult?.metadata?.calculationType === 'nighttime' ||
      location.siqsResult?.isNighttimeCalculation ||
      location.siqsResult?.factors?.some((f: any) => f.nighttimeData);
    
    // Generate color class for text elements
    let colorClass = 'text-red-500';
    if (scoreValue >= 7.5) colorClass = 'text-emerald-500';
    else if (scoreValue >= 5.5) colorClass = 'text-blue-500';
    else if (scoreValue >= 3.5) colorClass = 'text-amber-500';
    
    return {
      displayScore,
      scoreValue,
      colorClass,
      badgeColor,
      badgeBgColor,
      isViable: scoreValue >= 5.0,
      isNighttimeCalculation
    };
  }, [location]);
}

/**
 * Get SIQS class name based on score value
 * @param score SIQS score
 * @returns CSS class name
 */
export function getSiqsClassName(score: number): string {
  if (score >= 7.5) return 'siqs-excellent';
  if (score >= 5.5) return 'siqs-good';
  if (score >= 3.5) return 'siqs-fair';
  return 'siqs-poor';
}
