
import React, { useState } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { Lightbulb, Calendar, Cloud, Droplets, Wind, Thermometer } from 'lucide-react';
import { formatSIQSScore } from '@/utils/geoUtils';

export interface LocationsGridProps {
  locations: SharedAstroSpot[];
  initialLoad?: boolean;
  isMobile?: boolean;
  onViewDetails: (point: SharedAstroSpot) => void;
  isForecast?: boolean;
}

const LocationsGrid: React.FC<LocationsGridProps> = ({ 
  locations, 
  initialLoad = true, 
  isMobile: propsMobile,
  onViewDetails,
  isForecast = false
}) => {
  const { t } = useLanguage();
  const defaultIsMobile = useIsMobile();
  const isMobile = propsMobile !== undefined ? propsMobile : defaultIsMobile;
  
  if (!locations || locations.length === 0) {
    return null;
  }
  
  // Use subgrid for desktop, stack for mobile
  const gridClass = isMobile 
    ? "grid grid-cols-1 gap-3" 
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3";
  
  return (
    <div className={gridClass}>
      {locations.map((location) => (
        <div 
          key={location.id || `${location.latitude}-${location.longitude}`} 
          className="bg-card rounded-lg p-3 shadow-sm border border-border hover:border-primary/40 hover:bg-accent/40 transition-all cursor-pointer"
          onClick={() => onViewDetails(location)}
        >
          <div className="flex justify-between items-start mb-1">
            <div className="flex-1">
              <h3 className="text-base font-medium leading-tight truncate">
                {isForecast 
                  ? `${t("Forecast", "预测点")} (${location.forecastDate ? format(new Date(location.forecastDate), 'MMM d') : ''})`
                  : location.name || t("Unnamed Location", "未命名位置")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                {location.distance !== undefined && (
                  <span className="ml-1">• {location.distance < 1 
                    ? `${(location.distance * 1000).toFixed(0)}m` 
                    : `${location.distance.toFixed(1)}km`}
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-1 mb-1 bg-primary/10 px-2 py-0.5 rounded-full">
                <Lightbulb className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium">
                  {formatSIQSScore(location.siqs)}/10
                </span>
              </div>
            </div>
          </div>
          
          {isForecast && location.weatherData && (
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <Cloud className="h-3 w-3 text-muted-foreground" />
                <span>{location.weatherData.cloudCover}% {t("Cloud", "云层")}</span>
              </div>
              {location.weatherData.precipitation !== undefined && (
                <div className="flex items-center space-x-1">
                  <Droplets className="h-3 w-3 text-muted-foreground" />
                  <span>{location.weatherData.precipitation}mm</span>
                </div>
              )}
              {location.weatherData.windSpeed !== undefined && (
                <div className="flex items-center space-x-1">
                  <Wind className="h-3 w-3 text-muted-foreground" />
                  <span>{location.weatherData.windSpeed} km/h</span>
                </div>
              )}
              {location.weatherData.temperature !== undefined && (
                <div className="flex items-center space-x-1">
                  <Thermometer className="h-3 w-3 text-muted-foreground" />
                  <span>{location.weatherData.temperature}°C</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default React.memo(LocationsGrid);
