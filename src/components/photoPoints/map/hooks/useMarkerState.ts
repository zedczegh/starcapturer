
import { useMemo } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore, formatSiqsForDisplay } from '@/utils/siqsHelpers';
import { getLocationMarker } from '../MarkerUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseMarkerStateProps {
  location: SharedAstroSpot;
  realTimeSiqs: number | { score: number; isViable: boolean } | null;
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
    if (realTimeSiqs !== null) {
      return getSiqsScore(realTimeSiqs);
    }
    
    // Use location's SIQS regardless of certification status
    const locationSiqs = getSiqsScore(location.siqs);
    if (locationSiqs > 0) {
      return locationSiqs;
    }
    
    // Return null if no valid SIQS available
    return null;
  }, [location, realTimeSiqs]);
  
  // Create a location object with updated SIQS for marker color calculation
  const locationWithSiqs = useMemo(() => {
    if (realTimeSiqs !== null) {
      return { ...location, siqs: getSiqsScore(realTimeSiqs) };
    }
    return location;
  }, [location, realTimeSiqs]);
  
  // Get marker icon - now updates when realTimeSiqs changes
  const icon = useMemo(() => {
    return getLocationMarker(locationWithSiqs, isCertified, isHovered, isMobile);
  }, [locationWithSiqs, isCertified, isHovered, isMobile]);

  return {
    displayName,
    siqsScore,
    icon
  };
}
