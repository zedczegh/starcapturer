
import { useMemo } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { getLocationMarker } from '../MarkerUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatSiqsForDisplay } from '@/utils/unifiedSiqsDisplay';

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
  
  // Calculate the display name
  const displayName = useMemo(() => {
    if (language === 'zh' && location.chineseName) {
      return location.chineseName;
    }
    return location.name || t("Unnamed Location", "未命名位置");
  }, [language, location.chineseName, location.name, t]);

  // Calculate normalized SIQS score
  const siqsScore = useMemo(() => {
    if (realTimeSiqs !== null) {
      return formatSiqsForDisplay(realTimeSiqs);
    }
    
    const locationSiqs = getSiqsScore(location);
    return locationSiqs > 0 ? formatSiqsForDisplay(locationSiqs) : null;
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
