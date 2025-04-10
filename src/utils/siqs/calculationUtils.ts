
import { calculateCloudScore, calculateLightPollutionScore } from '@/lib/siqs/factors';

/**
 * Extract and format SIQS data consistently across the application
 * @param location Location object with SIQS information
 * @returns An object with formatted SIQS data
 */
export function extractSiqsData(location: any) {
  if (!location) {
    return {
      siqsValue: 0,
      displayScore: '0.0',
      isNighttimeCalculation: false,
      colorClass: 'bg-red-500/80 border-red-400/50',
      isViable: false
    };
  }
  
  // Get SIQS value with consistent approach
  let siqsValue = 0;
  
  // First try siqsResult.score (most accurate)
  if (location.siqsResult && typeof location.siqsResult.score === 'number') {
    siqsValue = location.siqsResult.score;
  }
  // Then try the siqs property
  else if (typeof location.siqs === 'number') {
    siqsValue = location.siqs;
  }
  // Lastly estimate from bortle scale
  else if (typeof location.bortleScale === 'number') {
    siqsValue = (10 - location.bortleScale * 0.75) + 3;
  }
  
  // Ensure value is in range 0-10
  siqsValue = Math.min(10, Math.max(0, siqsValue));
  
  // Format score with consistent decimal places
  const displayScore = siqsValue.toFixed(1);
  
  // Check if nighttime calculation was used
  const isNighttimeCalculation = location.siqsResult?.metadata?.calculationType === 'nighttime' ||
    location.siqsResult?.isNighttimeCalculation === true ||
    (Array.isArray(location.siqsResult?.factors) && 
      location.siqsResult?.factors.some((f: any) => f.nighttimeData));
  
  // Determine color class based on score
  let colorClass = 'bg-red-500/80 border-red-400/50';
  if (siqsValue >= 7.5) {
    colorClass = 'bg-green-500/80 border-green-400/50';
  } else if (siqsValue >= 5.0) {
    colorClass = 'bg-amber-500/80 border-amber-400/50';
  } else if (siqsValue >= 2.5) {
    colorClass = 'bg-orange-500/80 border-orange-400/50';
  }
  
  return {
    siqsValue,
    displayScore,
    isNighttimeCalculation,
    colorClass,
    isViable: siqsValue >= 5.0
  };
}

/**
 * Calculate a basic SIQS score based on cloud cover and light pollution
 * @param cloudCover Percentage of cloud cover (0-100)
 * @param bortleScale Bortle scale for light pollution (1-9)
 * @returns SIQS score on 0-10 scale
 */
export function calculateBasicSiqs(cloudCover: number, bortleScale: number): number {
  // Validate inputs
  const validCloudCover = Math.min(100, Math.max(0, cloudCover));
  const validBortleScale = Math.min(9, Math.max(1, bortleScale));
  
  // Calculate individual scores (0-100 scale)
  const cloudScore = calculateCloudScore(validCloudCover);
  const lightPollutionScore = calculateLightPollutionScore(validBortleScale);
  
  // Define weights
  const cloudWeight = 0.65;
  const lightPollutionWeight = 0.35;
  
  // Calculate weighted final score (0-10 scale)
  const siqs = (cloudScore * cloudWeight + lightPollutionScore * lightPollutionWeight) / 10;
  
  // Ensure score is in 0-10 range
  return Math.min(10, Math.max(0, siqs));
}

/**
 * Get color hex code based on SIQS score
 * @param score SIQS score (0-10)
 * @returns Hex color code
 */
export function getSiqsColor(score: number): string {
  if (score >= 7.5) return '#22c55e'; // Green
  if (score >= 5.0) return '#f59e0b'; // Amber
  if (score >= 2.5) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

/**
 * Format a SIQS score for consistent display
 * @param score Raw SIQS score
 * @returns Formatted string with one decimal place
 */
export function formatSiqs(score: number | null | undefined): string {
  if (score === null || score === undefined || isNaN(score)) return '0.0';
  return score.toFixed(1);
}
