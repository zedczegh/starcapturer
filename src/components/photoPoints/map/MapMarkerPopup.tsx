
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowRight, CloudSun, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistance } from '@/utils/formatters';
import SiqsDisplay from './SiqsDisplay';
import { normalizeToSiqsScale } from '@/utils/siqsHelpers';

interface MapMarkerPopupProps {
  location: SharedAstroSpot;
  onClick?: (location: SharedAstroSpot) => void;
  isForecast?: boolean;
}

const MapMarkerPopup: React.FC<MapMarkerPopupProps> = ({ 
  location, 
  onClick,
  isForecast = false
}) => {
  const { t } = useLanguage();
  const { name, latitude, longitude, distance, siqs, isDarkSkyReserve, certification } = location;
  
  const displayName = location.chineseName && location.name 
    ? `${location.name} (${location.chineseName})` 
    : location.name || t('Unnamed Location', '未命名位置');
  
  const handleDetailsClick = () => {
    if (onClick) onClick(location);
  };
  
  const normalizedSiqs = siqs ? normalizeToSiqsScale(siqs) : null;
  
  const locationTypeLabel = isDarkSkyReserve 
    ? t('Dark Sky Reserve', '黑暗天空保护区')
    : certification 
      ? t('Certified Location', '认证地点')
      : isForecast
        ? t('Forecast Location', '预测地点')
        : t('Calculated Location', '计算位置');
  
  const locationTypeColor = isDarkSkyReserve 
    ? 'bg-yellow-500/90' 
    : certification 
      ? 'bg-green-500/90' 
      : isForecast 
        ? 'bg-blue-500/90'
        : 'bg-primary/90';

  return (
    <div className="p-1">
      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className={`${locationTypeColor} text-white px-2 py-0.5`}>
            {locationTypeLabel}
          </Badge>
          
          {isForecast && location.forecastDay && (
            <Badge variant="outline" className="bg-blue-500/80 text-white px-2 py-0.5 flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              {t('Day', '天')} {location.forecastDay}
            </Badge>
          )}
        </div>
        
        <h3 className="font-medium text-sm mt-2 mb-1 leading-tight">{displayName}</h3>
        
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <MapPin className="h-3 w-3 mr-1" />
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
          {distance !== undefined && (
            <span className="ml-1.5">
              ({formatDistance(distance)})
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isForecast ? (
              <div className="flex items-center gap-1">
                <CloudSun className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium">{t('Forecast SIQS', '预测SIQS')}</span>
              </div>
            ) : (
              normalizedSiqs && <SiqsDisplay realTimeSiqs={normalizedSiqs} loading={false} />
            )}
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1 text-xs" 
            onClick={handleDetailsClick}
          >
            {t('View', '查看')}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        
        {isForecast && location.forecastData && (
          <div className="mt-2 pt-2 border-t border-border text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>{t('Cloud Cover', '云层')}: {location.forecastData.cloudCover}%</span>
              <span>{t('Precip Chance', '降水概率')}: {location.forecastData.precipitationProbability}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapMarkerPopup;
