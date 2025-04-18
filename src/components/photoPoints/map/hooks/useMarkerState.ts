import { useMemo } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { getLocationMarker } from '../MarkerUtils';
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
  
  // Calculate the display name based on language preference
  const displayName = useMemo(() => {
    if (language === 'zh' && location.chineseName) {
      return location.chineseName;
    }
    
    return location.name || t("Unnamed Location", "未命名位置");
  }, [language, location.chineseName, location.name, t]);

  // Calculate the SIQS score to display, WITHOUT giving default scores to certified locations
  const siqsScore = useMemo(() => {
    // Use real-time SIQS if available
    if (realTimeSiqs !== null) return realTimeSiqs;
    
    // Otherwise use location's SIQS if available
    const locationSiqs = getSiqsScore(location);
    if (locationSiqs > 0) return locationSiqs;
    
    // No default scores for certified locations - treat them like calculated spots
    return null;
  }, [location, realTimeSiqs]);
  
  // Get marker icon
  const icon = useMemo(() => {
    return getLocationMarker(location, isCertified, isHovered, isMobile);
  }, [location, isCertified, isHovered, isMobile]);

  return {
    displayName,
    siqsScore,
    icon
  };
}
