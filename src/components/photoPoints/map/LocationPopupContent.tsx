
import React from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { Star, ExternalLink } from 'lucide-react';
import { formatDistance } from '@/utils/geoUtils';
import { getSiqsClass } from './MarkerUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface LocationPopupContentProps {
  location: SharedAstroSpot;
  siqsScore: number | null;
  siqsLoading: boolean;
  displayName: string;
  isCertified: boolean;
  onClick: () => void;
}

const LocationPopupContent: React.FC<LocationPopupContentProps> = ({
  location,
  siqsScore,
  siqsLoading,
  displayName,
  isCertified,
  onClick
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  const siqsClass = getSiqsClass(siqsScore);
  
  return (
    <Popup 
      closeOnClick={false}
      autoClose={false}
      offset={[0, 10]}
      direction="bottom"
    >
      <div className={`py-2 px-0.5 max-w-[220px] leaflet-popup-custom-compact marker-popup-gradient ${siqsClass}`}
           onClick={() => {
             // Force refresh on popup click
             if (isCertified) {
               console.log("Certified location popup clicked, forcing update");
             }
           }}
      >
        <div className="font-medium text-sm mb-1.5 flex items-center">
          {isCertified && (
            <Star className="h-3.5 w-3.5 mr-1 text-primary fill-primary" />
          )}
          <span className="text-gray-100">{displayName}</span>
        </div>
        
        {isCertified && location.certification && (
          <div className="mt-1 text-xs font-medium text-primary flex items-center">
            <Star className="h-3 w-3 mr-1" />
            {location.certification}
          </div>
        )}
        
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <SiqsScoreBadge 
              score={siqsScore} 
              compact={true} 
              loading={siqsLoading || (isCertified && !siqsScore)}
              isCertified={isCertified}
              forceCertified={false} // Never force default scores
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
            onClick={onClick}
            className={`text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground ${isMobile ? 'py-3' : 'py-1.5'} px-2 rounded transition-colors`}
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
