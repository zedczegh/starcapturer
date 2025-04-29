
import React from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Info } from 'lucide-react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface MarkerPopupContentProps {
  location: SharedAstroSpot;
  onClick?: (location: SharedAstroSpot) => void;
  isForecast?: boolean;
}

const MarkerPopupContent: React.FC<MarkerPopupContentProps> = ({
  location,
  onClick,
  isForecast = false
}) => {
  const { t } = useLanguage();
  
  // Format SIQS score for display
  const formattedSiqs = typeof location.siqs === 'number' 
    ? location.siqs.toFixed(1) 
    : (typeof location.siqs === 'object' && location.siqs?.score 
      ? location.siqs.score.toFixed(1)
      : '?');
  
  // Format distance for display
  const formattedDistance = location.distance 
    ? location.distance < 10 
      ? location.distance.toFixed(1) 
      : Math.round(location.distance) 
    : null;
  
  // Format forecast date if present
  const formattedForecastDate = location.forecastDate 
    ? new Date(location.forecastDate).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      })
    : null;
  
  const handleViewDetails = () => {
    if (onClick) {
      onClick(location);
    }
  };
  
  return (
    <div className="popup-content min-w-[220px]">
      <h4 className="font-medium text-sm mb-1 text-primary">
        {location.name || t("Unnamed Location", "未命名位置")}
      </h4>
      
      {isForecast && formattedForecastDate && (
        <div className="flex items-center text-xs text-purple-600 mb-2">
          <Calendar size={12} className="mr-1" />
          <span>{formattedForecastDate}</span>
        </div>
      )}
      
      <div className="flex flex-col gap-1 mb-3 text-xs text-muted-foreground">
        {/* Location coordinates */}
        <div>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</div>
        
        {/* Display location type and certification if available */}
        {location.certification && (
          <div className="text-blue-600 font-medium">{location.certification}</div>
        )}
        
        {location.isDarkSkyReserve && (
          <div className="text-purple-600 font-medium">{t("Dark Sky Reserve", "暗夜保护区")}</div>
        )}
        
        {/* SIQS score */}
        <div className="flex items-center">
          <span className="font-medium mr-1">SIQS:</span> 
          <span className="text-blue-600 font-medium">{formattedSiqs}</span>
        </div>
        
        {/* Distance if available */}
        {formattedDistance && (
          <div>
            <span className="font-medium mr-1">{t("Distance", "距离")}:</span> 
            {formattedDistance} km
          </div>
        )}
      </div>
      
      <Button 
        size="sm" 
        className="w-full flex items-center gap-1" 
        onClick={handleViewDetails}
      >
        <Info size={14} />
        {t("View Details", "查看详情")}
      </Button>
    </div>
  );
};

export default MarkerPopupContent;
