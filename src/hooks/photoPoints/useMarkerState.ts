
import { useMemo } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { getLocationMarker } from '@/components/photoPoints/map/MarkerUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseMarkerStateProps {
  location: SharedAstroSpot;
  realTimeSiqs: number | null;
  isCertified: boolean;
  isHovered: boolean;
}

export function useMarkerState({ 
  location, 
  realTimeSiqs, 
  isCertified, 
  isHovered 
}: UseMarkerStateProps) {
  const { language, t } = useLanguage();
  const isMobile = useIsMobile();
  
  // Calculate the display name based on language preference and certification status
  const displayName = useMemo(() => {
    // For Chinese language
    if (language === 'zh') {
      // If the location has a specific Chinese name, use it
      if (location.chineseName) {
        return location.chineseName;
      }
    }
    
    // For certified locations, keep the original name regardless of language
    if (isCertified && location.name) {
      return location.name;
    }
    
    // Fallback to the regular name or placeholder
    return location.name || t("Unnamed Location", "未命名位置");
  }, [language, location.chineseName, location.name, isCertified, t]);

  // Calculate SIQS score - always use real-time or location's SIQS
  const siqsScore = useMemo(() => {
    // Always prefer real-time SIQS if available
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      return realTimeSiqs;
    }
    
    // Use location's SIQS regardless of certification status
    const locationSiqs = getSiqsScore(location.siqs);
    if (locationSiqs !== null && locationSiqs > 0) {
      return locationSiqs;
    }
    
    // Return null if no valid SIQS available
    return null;
  }, [location, realTimeSiqs]);
  
  // Get marker icon without considering Bortle scale
  const icon = useMemo(() => {
    return getLocationMarker(location, isCertified, isHovered, isMobile);
  }, [location, isCertified, isHovered, isMobile]);

  return {
    displayName,
    siqsScore,
    icon
  };
}
