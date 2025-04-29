
import { useMemo } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/types/weather';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { useIsMobile } from '@/hooks/use-mobile';
import { getCertifiedLocationIcon, getCalculatedLocationIcon, getDarkSkyLocationIcon, getForecastLocationIcon } from '../MarkerUtils';

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
  
  // Calculate the display name based on language preference
  const displayName = useMemo(() => {
    if (language === 'zh' && location.chineseName) {
      return location.chineseName;
    }
    return location.name || t("Unnamed Location", "未命名位置");
  }, [language, location.chineseName, location.name, t]);

  // Calculate SIQS score - always use real-time or location's SIQS
  const siqsScore = useMemo(() => {
    // Always prefer real-time SIQS if available
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      return realTimeSiqs;
    }
    
    // Use location's SIQS regardless of certification status
    const locationSiqs = getSiqsScore(location);
    if (locationSiqs > 0) {
      return locationSiqs;
    }
    
    // Return null if no valid SIQS available
    return null;
  }, [location, realTimeSiqs]);
  
  // Get marker icon for this location
  const icon = useMemo(() => {
    if (location.isForecast) {
      return getForecastLocationIcon(isHovered);
    }
    
    if (location.isDarkSkyReserve) {
      return getDarkSkyLocationIcon(isHovered);
    }
    
    if (isCertified || location.certification) {
      return getCertifiedLocationIcon(isHovered);
    }
    
    return getCalculatedLocationIcon(isHovered);
  }, [location, isCertified, isHovered]);

  return {
    displayName,
    siqsScore,
    icon
  };
}
