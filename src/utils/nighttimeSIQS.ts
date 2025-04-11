
import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Get a consistent SIQS value from a location
 * Prioritizes siqsResult.score, then siqs property
 * @param location Location object
 * @returns Consistent SIQS value or undefined
 */
export const getConsistentSiqsValue = (location: SharedAstroSpot): number | undefined => {
  if (!location) return undefined;
  
  if (location.siqsResult?.score !== undefined && location.siqsResult.score !== null) {
    return location.siqsResult.score;
  }
  
  if (location.siqs !== undefined && location.siqs !== null) {
    return location.siqs;
  }
  
  return undefined;
};

/**
 * Format a SIQS score for display
 * @param score SIQS score
 * @returns Formatted SIQS score string
 */
export const formatSIQSScore = (score: number | undefined | null): string => {
  if (score === undefined || score === null) return "0.0";
  return score.toFixed(1);
};

/**
 * Check if the current time is during astronomical night
 * Astronomical night is when the sun is at least 18° below the horizon
 * This is a simplified implementation without actual solar position calculation
 * @returns Boolean indicating if it's currently astronomical night
 */
export const isAstronomicalNight = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  
  // Simplified check - astronomical night is roughly between 10 PM and 4 AM
  return (hour >= 22 || hour <= 4);
};

/**
 * Determine if a SIQS score is viable for astrophotography
 * @param score SIQS score
 * @returns Boolean indicating if the score is viable
 */
export const isSiqsViable = (score: number | undefined | null): boolean => {
  if (score === undefined || score === null) return false;
  return score >= 6.5;
};
