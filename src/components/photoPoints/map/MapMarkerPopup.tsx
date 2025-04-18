
import React, { useState, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, MapPin, Navigation, RefreshCw } from 'lucide-react';
import { formatDistance } from '@/utils/geoUtils';
import { useDisplayName } from '../cards/DisplayNameResolver';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { getSiqsScore } from '@/utils/siqsHelpers';
import RealTimeSiqsProvider from '../cards/RealTimeSiqsProvider';
import { formatMapSiqs, getSiqsColorClass } from '@/utils/mapSiqsDisplay';

interface MapMarkerPopupProps {
  location: SharedAstroSpot;
  onClose: () => void;
  onViewDetails: (location: SharedAstroSpot) => void;
}

const MapMarkerPopup: React.FC<MapMarkerPopupProps> = ({ 
  location, 
  onClose, 
  onViewDetails 
}) => {
  const { language, t } = useLanguage();
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [siqsLoading, setSiqsLoading] = useState(false);
  const [siqsConfidence, setSiqsConfidence] = useState<number>(7);
  const [forceUpdate, setForceUpdate] = useState(false);
  
  const { displayName, showOriginalName, nearestTownInfo } = useDisplayName({
    location,
    language,
    locationCounter: null
  });
  
  // Determine if this is a certified location of any type
  const isCertified = Boolean(
    location.isDarkSkyReserve || 
    (location.certification && location.certification !== '') || 
    (location.type === 'lodging') || 
    (location.type === 'dark-site')
  );
  
  // Get certification text safely
  const certificationText = location.certification || 
    (location.isDarkSkyReserve ? t("Dark Sky Reserve", "暗夜天空保护区") : 
      (location.type === 'lodging' ? t("Dark Sky Lodging", "暗夜天空住宿") : ''));
  
  // Use the real-time SIQS if available, otherwise fall back to the location's static SIQS
  const staticSiqs = getSiqsScore(location);
  const displaySiqs = realTimeSiqs !== null ? realTimeSiqs : 
                      staticSiqs > 0 ? staticSiqs : 
                      (isCertified ? 6.5 : 0);
  
  const siqsColorClass = getSiqsColorClass(displaySiqs);
  
  const handleSiqsCalculated = (siqs: number | null, loading: boolean, confidence?: number) => {
    setRealTimeSiqs(siqs);
    setSiqsLoading(loading);
    if (confidence) setSiqsConfidence(confidence);
  };
  
  const handleRefreshSiqs = () => {
    setForceUpdate(true);
    setTimeout(() => setForceUpdate(false), 100);
  };
  
  return (
    <div className="p-3 min-w-[220px] max-w-[280px]">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-sm line-clamp-1">{displayName}</h4>
      </div>
      
      {/* Always show SIQS with more detailed info */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center">
          <SiqsScoreBadge 
            score={displaySiqs} 
            compact={false} 
            loading={siqsLoading}
            forceCertified={isCertified && staticSiqs <= 0 && realTimeSiqs === null}
          />
        </div>
        <button 
          onClick={handleRefreshSiqs} 
          className="text-muted-foreground hover:text-primary p-1 rounded-full"
          disabled={siqsLoading}
          title={t("Refresh SIQS", "刷新SIQS")}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${siqsLoading ? "animate-spin" : ""}`} />
        </button>
      </div>
      
      {/* Show certification for all certified location types */}
      {isCertified && certificationText && (
        <div className="flex items-center mb-2 mt-1">
          <div className="flex items-center text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            <Star className="h-3.5 w-3.5 mr-1" />
            <span>{certificationText}</span>
          </div>
        </div>
      )}

      {/* Show original name if different */}
      {showOriginalName && (
        <div className="flex items-center mb-2">
          <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          <span className="text-xs text-muted-foreground line-clamp-1">
            {language === 'zh' ? location.name : location.chineseName}
          </span>
        </div>
      )}
      
      {/* Show nearest town info */}
      {nearestTownInfo && nearestTownInfo.detailedName && (
        <div className="flex items-center mb-2">
          <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          <span className="text-xs text-muted-foreground line-clamp-1">
            {nearestTownInfo.detailedName}
          </span>
        </div>
      )}
      
      {/* Show distance if available */}
      {location.distance !== undefined && (
        <div className="flex items-center mb-2">
          <Navigation className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {formatDistance(location.distance)}
          </span>
        </div>
      )}
      
      {/* Show coordinates */}
      {location.latitude !== undefined && location.longitude !== undefined && (
        <div className="flex items-center mb-2">
          <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </span>
        </div>
      )}
      
      <div className="mt-2 flex justify-end">
        <Button 
          size="sm"
          variant="secondary"
          className="h-7 py-0 px-2 text-xs"
          onClick={() => onViewDetails(location)}
        >
          {t("Details", "详情")}
        </Button>
      </div>
      
      {/* Real-time SIQS provider - hidden component */}
      <RealTimeSiqsProvider
        isVisible={true}
        latitude={location.latitude}
        longitude={location.longitude}
        bortleScale={location.bortleScale}
        isCertified={isCertified}
        isDarkSkyReserve={location.isDarkSkyReserve}
        existingSiqs={location.siqs}
        onSiqsCalculated={handleSiqsCalculated}
        forceUpdate={forceUpdate}
      />
    </div>
  );
};

export default MapMarkerPopup;
