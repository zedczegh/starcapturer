
import React, { useState, useEffect } from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { Star, ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { getDisplaySiqs } from '@/utils/unifiedSiqsDisplay';
import { formatDistance } from '@/utils/geoUtils';
import { getSiqsClass } from './MarkerUtils';

interface LocationPopupContentProps {
  location: SharedAstroSpot;
  siqsScore: number | null;
  siqsLoading: boolean;
  displayName: string;
  isCertified: boolean;
  onViewDetails: (location: SharedAstroSpot) => void;
}

const LocationPopupContent: React.FC<LocationPopupContentProps> = ({
  location,
  siqsScore,
  siqsLoading,
  displayName,
  isCertified,
  onViewDetails,
}) => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [stabilizedScore, setStabilizedScore] = useState<number | null>(null);
  
  // For certified locations, prioritize appropriate name based on language
  const finalDisplayName = isCertified ? 
    (language === 'zh' && location.chineseName ? location.chineseName : 
     (location.name || displayName)) : 
    (language === 'zh' && location.chineseName ? location.chineseName : displayName);
  
  useEffect(() => {
    if (siqsScore !== null && siqsScore > 0) {
      setStabilizedScore(siqsScore);
    }
  }, [siqsScore]);

  const siqsClass = getSiqsClass(stabilizedScore || siqsScore);
  const hasValidScore = stabilizedScore !== null || (siqsScore !== null && siqsScore > 0);

  // Get certification text based on language
  const getCertificationText = () => {
    if (!location.certification && !location.isDarkSkyReserve) return null;
    
    if (location.isDarkSkyReserve) {
      return t("Dark Sky Reserve", "暗夜保护区");
    }
    
    if (!location.certification) return null;
    
    const cert = location.certification.toLowerCase();
    if (cert.includes('park')) {
      return t("Dark Sky Park", "暗夜公园");
    } else if (cert.includes('community')) {
      return t("Dark Sky Community", "暗夜社区");
    } else if (cert.includes('urban')) {
      return t("Urban Night Sky", "城市夜空");
    } else if (cert.includes('lodging')) {
      return t("Dark Sky Lodging", "暗夜住宿");
    } else {
      return t("Certified Location", "认证地点");
    }
  };

  return (
    <Popup 
      closeOnClick={false}
      autoClose={false}
      offset={[0, 10]}
      direction="bottom"
    >
      <div 
        className={`py-2 px-0.5 max-w-[220px] leaflet-popup-custom-compact marker-popup-gradient ${siqsClass}`}
      >
        <div className="font-medium text-sm mb-1.5 flex items-center">
          {isCertified && (
            <Star className="h-3.5 w-3.5 mr-1 text-primary fill-primary" />
          )}
          <span className="text-gray-100">{finalDisplayName}</span>
        </div>
        
        {isCertified && (location.certification || location.isDarkSkyReserve) && (
          <div className="mt-1 text-xs font-medium text-primary flex items-center">
            <Star className="h-3 w-3 mr-1" />
            {getCertificationText()}
          </div>
        )}
        
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <SiqsScoreBadge 
              score={hasValidScore ? (stabilizedScore || siqsScore) : null} 
              compact={true} 
              loading={siqsLoading}
              isCertified={isCertified}
            />
          </div>
          
          {typeof location.distance === 'number' && isFinite(location.distance) && (
            <span className="text-xs text-gray-300 flex items-center justify-end">
              {formatDistance(location.distance)}
            </span>
          )}
        </div>
        
        <div className="mt-2 text-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(location);
            }}
            className={`text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground ${isMobile ? 'py-2.5' : 'py-1.5'} px-2 rounded transition-colors`}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {t("View Details", "查看详情")}
          </button>
        </div>
      </div>
    </Popup>
  );
};

export default React.memo(LocationPopupContent);
