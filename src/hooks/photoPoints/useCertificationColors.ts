
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
      return '#FFD700'; // Default gold
    }
    
    const certification = (location.certification || '').toLowerCase();
    
    // Different colors for different certification types
    if (certification.includes('reserve') || certification.includes('sanctuary')) {
      return '#9b87f5'; // Purple for reserves
    } else if (certification.includes('park')) {
      return '#4ADE80'; // Green for parks
    } else if (certification.includes('community')) {
      return '#FFA500'; // Orange for communities
    } else if (certification.includes('urban')) {
      return '#0EA5E9'; // Blue for urban night skies
    } else if (location.isDarkSkyReserve) {
      return '#9b87f5'; // Purple for reserves
    } else {
      return '#FFD700'; // Gold for generic certified locations
    }
  };
  
  return { getCertificationColor };
};

export default useCertificationColors;
