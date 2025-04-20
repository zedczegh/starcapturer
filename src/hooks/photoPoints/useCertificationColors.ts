
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Hook to get certification colors for locations
 */
export const useCertificationColors = () => {
  /**
   * Get color based on certification type
   * @param location Location to get color for
   */
  const getCertificationColor = (location: SharedAstroSpot): string => {
    if (!location.isDarkSkyReserve && !location.certification) {
      return '#22c55e'; // Default color for non-certified (matching SIQS excellent)
    }
    
    const certification = (location.certification || '').toLowerCase();
    
    // Different colors for different certification types - matching legend colors
    if (certification.includes('reserve') || certification.includes('sanctuary') || location.isDarkSkyReserve) {
      return '#9b87f5'; // Purple for reserves - exact match with legend
    } else if (certification.includes('park')) {
      return '#4ADE80'; // Green for parks - exact match with legend
    } else if (certification.includes('community')) {
      return '#FFA500'; // Orange for communities - exact match with legend
    } else if (certification.includes('urban')) {
      return '#0EA5E9'; // Blue for urban night skies - exact match with legend
    } else if (certification.includes('lodging')) {
      return '#1e3a8a'; // Dark blue for lodging - exact match with legend
    } else {
      return '#9b87f5'; // Default to reserve color
    }
  };
  
  return { getCertificationColor };
};

export default useCertificationColors;
