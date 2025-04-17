
import React, { useState, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, MapPin, Navigation } from 'lucide-react';
import { formatDistance } from '@/utils/geoUtils';
import { useDisplayName } from '../cards/DisplayNameResolver';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';

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
  const [loading, setLoading] = useState(false);
  
  const { displayName, showOriginalName, nearestTownInfo } = useDisplayName({
    location,
    language,
    locationCounter: null
  });
  
  // Determine if this is a certified location of any type
  // Handle the potentially undefined type property safely
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
  
  // Extract SIQS score from any format using our helper function
  const initialSiqsScore = getSiqsScore(location);
  // Always show SIQS badge for certified locations
  const hasSiqs = initialSiqsScore > 0 || isCertified;
  
  // Fetch real-time SIQS data for certified locations
  useEffect(() => {
    if (isCertified && location.latitude && location.longitude) {
      const fetchRealTimeSiqs = async () => {
        // Skip if we already have data
        if (realTimeSiqs !== null) return;
        
        setLoading(true);
        try {
          // Use appropriate Bortle scale based on location type
          const estimatedBortleScale = location.isDarkSkyReserve ? 3 : 
            (location.certification ? 4 : 5);
          
          // Create cache key for this location
          const cacheKey = `popup_siqs_${location.latitude.toFixed(4)}_${location.longitude.toFixed(4)}`;
          const cachedData = sessionStorage.getItem(cacheKey);
          
          if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            // Use cached data if less than 30 minutes old
            if (Date.now() - timestamp < 30 * 60 * 1000) {
              setRealTimeSiqs(data);
              setLoading(false);
              return;
            }
          }
          
          // Calculate real-time SIQS
          const result = await calculateRealTimeSiqs(
            location.latitude,
            location.longitude,
            estimatedBortleScale
          );
          
          if (result && typeof result.siqs === 'number') {
            setRealTimeSiqs(result.siqs);
            
            // Cache the result
            sessionStorage.setItem(cacheKey, JSON.stringify({
              data: result.siqs,
              timestamp: Date.now()
            }));
          }
        } catch (error) {
          console.error("Error fetching real-time SIQS for popup:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchRealTimeSiqs();
    }
  }, [isCertified, location]);
  
  // Use real-time SIQS if available, otherwise use the initial score
  const displaySiqs = realTimeSiqs !== null ? realTimeSiqs : initialSiqsScore;
  
  return (
    <div className="p-3 min-w-[200px] max-w-[280px]">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-sm line-clamp-1">{displayName}</h4>
        
        {/* Always show SIQS badge for certified locations */}
        {hasSiqs && (
          <SiqsScoreBadge 
            score={displaySiqs} 
            compact={true} 
            loading={loading}
            isCertified={isCertified && initialSiqsScore <= 0}
          />
        )}
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
    </div>
  );
};

export default MapMarkerPopup;
