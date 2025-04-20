
import { useEffect, useState } from "react";
import { findNearestTown } from "@/utils/nearestTownCalculator";
import { getLocationNameFromCoordinates } from "@/lib/api/location";
import { Language } from "@/services/geocoding/types";

interface UseLocationNameEnhancerProps {
  latitude?: number;
  longitude?: number;
  language: string;
}

export function useLocationNameEnhancer({
  latitude,
  longitude,
  language
}: UseLocationNameEnhancerProps) {
  const [enhancedName, setEnhancedName] = useState<string | null>(null);
  const [locationDetails, setLocationDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Ensure language is a valid Language type
  const typedLanguage: Language = language === 'zh' ? 'zh' : 'en';
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchEnhancedName = async () => {
      if (!latitude || !longitude) return;
      
      setIsLoading(true);
      
      try {
        // Try to get a detailed location name from our geocoding service
        const locationName = await getLocationNameFromCoordinates(
          latitude,
          longitude,
          typedLanguage
        );
        
        // Find nearest town as a backup
        const nearestTownInfo = findNearestTown(latitude, longitude, language);
        
        if (isMounted) {
          // Prefer the geocoded name if it's good, otherwise use nearest town info
          if (locationName && !locationName.includes('°') && locationName !== 'Unknown Location') {
            setEnhancedName(locationName);
          } else if (nearestTownInfo.detailedName) {
            setEnhancedName(nearestTownInfo.detailedName);
          }
          
          setLocationDetails({
            ...nearestTownInfo,
            geocodedName: locationName
          });
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error enhancing location name:", error);
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchEnhancedName();
    
    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, language, typedLanguage]);
  
  return { enhancedName, locationDetails, isLoading };
}
