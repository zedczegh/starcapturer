
import { useState, useEffect } from 'react';
import { Language } from '@/services/geocoding/types';
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { findNearestTown } from '@/utils/nearestTownCalculator';

interface EnhancedLocationDetailsProps {
  latitude?: number;
  longitude?: number;
  language: Language;
}

export interface LocationDetailsResult {
  detailedName: string | null;
  nearestTown: any | null;
}

/**
 * Hook for fetching enhanced location details
 */
export const useEnhancedLocationDetails = ({ 
  latitude, 
  longitude, 
  language 
}: EnhancedLocationDetailsProps): LocationDetailsResult => {
  const [enhancedLocation, setEnhancedLocation] = useState<any>(null);
  
  // Get enhanced location details
  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      const typedLanguage: Language = language === 'zh' ? 'zh' : 'en';
      
      getEnhancedLocationDetails(latitude, longitude, typedLanguage)
        .then(details => {
          setEnhancedLocation(details);
        })
        .catch(error => {
          console.error("Error fetching enhanced location for map tooltip:", error);
        });
    }
  }, [latitude, longitude, language]);
  
  // Get detailed location information if coordinates are available and enhanced details not yet loaded
  const nearestTownInfo = (latitude !== undefined && longitude !== undefined && !enhancedLocation) ? 
    findNearestTown(latitude, longitude, language === 'zh' ? 'zh' : 'en') : null;
  
  // Determine what location information to display
  const detailedName = enhancedLocation?.formattedName || 
                       enhancedLocation?.detailedName || 
                       (nearestTownInfo && nearestTownInfo.detailedName);
  
  return { detailedName, nearestTown: nearestTownInfo };
};
