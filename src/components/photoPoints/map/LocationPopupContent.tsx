
import React, { useState, useEffect } from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { Star, ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getSiqsScore } from '@/utils/siqsHelpers';
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
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [stabilizedScore, setStabilizedScore] = useState<number | null>(null);
  
  useEffect(() => {
    if (siqsScore !== null && siqsScore > 0) {
      setStabilizedScore(siqsScore);
    }
  }, [siqsScore]);

  const siqsClass = getSiqsClass(stabilizedScore || siqsScore);
  const hasValidScore = stabilizedScore !== null || (siqsScore !== null && siqsScore > 0);

  return (
    <Popup 
      closeOnClick={false}
      autoClose={false}
      offset={[0, 10]}
      direction="bottom"
      className="custom-popup location-popup"
    >
      <div 
        className={`py-3 px-3 max-w-[260px] rounded-lg bg-gradient-to-b from-gray-800/95 to-gray-900/95 shadow-lg border border-gray-700/50 ${siqsClass}`}
      >
        <div className="font-medium text-sm mb-2 flex items-center">
          {isCertified && (
            <Star className="h-4 w-4 mr-1.5 text-primary fill-primary" />
          )}
          <span className="text-gray-100">{displayName}</span>
        </div>
        
        {isCertified && location.certification && (
          <div className="mt-1.5 text-xs font-medium text-primary flex items-center">
            <Star className="h-3 w-3 mr-1" />
            {location.certification}
          </div>
        )}
        
        <div className="mt-2 py-2 border-t border-b border-gray-700/30 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <SiqsScoreBadge 
              score={hasValidScore ? (stabilizedScore || siqsScore) : null} 
              compact={true} 
              loading={siqsLoading}
              isCertified={isCertified}
              forceCertified={false}
            />
          </div>
          
          {typeof location.distance === 'number' && isFinite(location.distance) && (
            <span className="text-xs text-gray-300 flex items-center justify-end">
              {formatDistance(location.distance)}
            </span>
          )}
        </div>
        
        <div className="mt-3">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(location);
            }}
            className="text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground py-2 px-2.5 rounded transition-colors"
          >
            <ExternalLink className="h-3 w-3 mr-1.5" />
            {t("View Details", "查看详情")}
          </button>
        </div>
      </div>
    </Popup>
  );
};

export default React.memo(LocationPopupContent);
