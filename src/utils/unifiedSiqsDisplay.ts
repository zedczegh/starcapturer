
/**
 * Utility for consistent SIQS display logic across components
 */

interface DisplaySiqsProps {
  realTimeSiqs: number | null;
  staticSiqs: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  defaultScore?: number;
}

/**
 * Get the most appropriate SIQS score to display based on available data
 * @param props Object containing SIQS data sources and context
 * @returns The most appropriate SIQS score to display
 */
export const getDisplaySiqs = (props: DisplaySiqsProps): number => {
  const { 
    realTimeSiqs, 
    staticSiqs, 
    isCertified = false, 
    isDarkSkyReserve = false,
    defaultScore = 0
  } = props;
  
  // Always prefer real-time SIQS if available and valid
  if (realTimeSiqs !== null && realTimeSiqs > 0) {
    return realTimeSiqs;
  }
  
  // Next, use static SIQS if valid
  if (staticSiqs > 0) {
    return staticSiqs;
  }
  
  // For certified locations, provide a minimum default score if configured
  if (isCertified && defaultScore > 0) {
    // Dark Sky Reserves get slightly higher default
    return isDarkSkyReserve ? Math.max(7.0, defaultScore) : defaultScore;
  }
  
  // No valid score available
  return 0;
};
