
import React, { useEffect, useState } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import SiqsScoreBadge from '../../cards/SiqsScoreBadge';
import { Star, Award, ExternalLink, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistance } from '@/utils/geoUtils';
import { calculateNighttimeSIQS } from '@/utils/nighttimeSIQS';
import { fetchForecastData } from '@/lib/api';

interface MarkerPopupProps {
  location: SharedAstroSpot;
  siqsScore: number | null;
  siqsLoading: boolean;
  siqsClass: string;
  displayName: string;
  isCertified: boolean;
  onClose: () => void;
}

const MarkerPopup: React.FC<MarkerPopupProps> = ({
  location,
  siqsScore,
  siqsLoading,
  siqsClass,
  displayName,
  isCertified,
  onClose
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [nighttimeSiqs, setNighttimeSiqs] = useState<number | null>(null);
  const [nighttimeSiqsLoading, setNighttimeSiqsLoading] = useState(false);

  // Fetch nighttime SIQS on popup open
  useEffect(() => {
    const fetchNighttimeSiqs = async () => {
      if (location.latitude && location.longitude) {
        setNighttimeSiqsLoading(true);
        try {
          // Get forecast data for the location
          const forecastData = await fetchForecastData({
            latitude: location.latitude,
            longitude: location.longitude,
            days: 2
          });
          
          if (forecastData) {
            // Calculate nighttime SIQS using forecast data
            const result = calculateNighttimeSIQS(
              {
                weatherData: location.weatherData || {},
                bortleScale: location.bortleScale || 5,
                seeingConditions: location.seeingConditions || 3,
                moonPhase: location.moonPhase || 0
              },
              forecastData,
              (key: string) => key // Simple translator function
            );
            
            if (result && typeof result.score === 'number') {
              setNighttimeSiqs(result.score);
            }
          }
        } catch (error) {
          console.error("Error calculating nighttime SIQS:", error);
        } finally {
          setNighttimeSiqsLoading(false);
        }
      }
    };
    
    fetchNighttimeSiqs();
  }, [location]);

  const goToLocationDetails = () => {
    const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
    
    const navigationData = {
      id: locationId,
      name: location.name || 'Unnamed Location',
      chineseName: location.chineseName || '',
      latitude: location.latitude,
      longitude: location.longitude,
      bortleScale: location.bortleScale || 4,
      siqs: siqsScore || (location.siqs !== undefined ? location.siqs : undefined),
      nighttimeSiqs: nighttimeSiqs, // Add nighttime SIQS to navigation data
      timestamp: new Date().toISOString(),
      fromPhotoPoints: true,
      isDarkSkyReserve: Boolean(location.isDarkSkyReserve),
      certification: location.certification || '',
      siqsResult: (siqsScore !== null || location.siqs) ? { 
        score: siqsScore !== null ? siqsScore : location.siqs,
        isViable: typeof location.siqs === 'object' ? (location.siqs as any)?.isViable : (siqsScore !== null && siqsScore >= 2)
      } : undefined
    };
    
    navigate(`/location/${locationId}`, { 
      state: navigationData 
    });
    onClose();
  };

  return (
    <div className={`py-2 px-0.5 max-w-[220px] leaflet-popup-custom-compact marker-popup-gradient ${siqsClass}`}>
      <div className="font-medium text-sm mb-1.5 flex items-center">
        {isCertified && (
          <Star className="h-3.5 w-3.5 mr-1 text-primary fill-primary" />
        )}
        <span className="text-gray-100">{displayName || t("Unnamed Location", "未命名位置")}</span>
      </div>
      
      {isCertified && location.certification && (
        <div className="mt-1 text-xs font-medium text-primary flex items-center">
          <Award className="h-3 w-3 mr-1" />
          {location.certification}
        </div>
      )}
      
      <div className="mt-2 flex items-center justify-between">
        {(siqsScore !== null || siqsLoading) && (
          <div className="flex items-center gap-1.5">
            <SiqsScoreBadge 
              score={siqsScore || 0} 
              compact={true} 
              loading={siqsLoading}
              showPlaceholder={false}
            />
          </div>
        )}
        
        {typeof location.distance === 'number' && isFinite(location.distance) && (
          <span className="text-xs text-gray-300 flex items-center justify-end">
            {formatDistance(location.distance)}
          </span>
        )}
      </div>
      
      {/* Night SIQS Section - Added for nighttime SIQS */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center">
          <Moon className="h-3 w-3 mr-1 text-blue-300" />
          <span className="text-xs text-gray-300">Night SIQS:</span>
        </div>
        
        <div className="flex items-center">
          {nighttimeSiqsLoading ? (
            <span className="text-xs text-gray-400">Calculating...</span>
          ) : (
            <SiqsScoreBadge 
              score={nighttimeSiqs || 0} 
              compact={true} 
              showPlaceholder={false}
            />
          )}
        </div>
      </div>
      
      <div className="mt-2 text-center">
        <button 
          onClick={goToLocationDetails}
          className={`text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground ${isMobile ? 'py-3' : 'py-1.5'} px-2 rounded transition-colors`}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          {t("View Details", "查看详情")}
        </button>
      </div>
    </div>
  );
};

export default MarkerPopup;
