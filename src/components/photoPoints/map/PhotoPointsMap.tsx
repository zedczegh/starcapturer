
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import LazyMapContainer from './LazyMapContainer';
import { formatSIQSScore } from '@/utils/geoUtils';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import { usePhotoPointsMap } from '@/hooks/photoPoints/usePhotoPointsMap';

interface PhotoPointsMapProps {
  locations: SharedAstroSpot[];
  userLocation: { latitude: number; longitude: number } | null;
  onSelectLocation: (location: SharedAstroSpot) => void;
  loading?: boolean;
  searchRadius: number;
  currentSiqs?: number | null;
}

const PhotoPointsMap: React.FC<PhotoPointsMapProps> = ({
  locations,
  userLocation,
  onSelectLocation,
  loading = false,
  searchRadius,
  currentSiqs
}) => {
  const { t } = useLanguage();
  
  // Use our dedicated map hook
  const {
    mapLoaded,
    selectedLocationId,
    mapPosition,
    getInitialZoom,
    filteredLocations,
    handleMapReady,
    handleLocationSelect
  } = usePhotoPointsMap({
    locations,
    userLocation,
    currentSiqs: currentSiqs || null
  });

  // Calculate zoom level based on search radius
  const initialZoom = getInitialZoom(searchRadius);

  // Handle location selection
  const handleSelectLocationWrapper = useCallback((location: SharedAstroSpot) => {
    const selectedLocation = handleLocationSelect(location);
    onSelectLocation(selectedLocation);
  }, [handleLocationSelect, onSelectLocation]);

  return (
    <div className="relative h-[500px] md:h-[600px] w-full rounded-lg overflow-hidden border border-border/30 bg-background/50 shadow-sm">
      {(!mapLoaded || loading) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            {loading 
              ? t("Finding optimal viewing locations...", "正在寻找最佳观测位置...") 
              : t("Loading map...", "正在加载地图...")}
          </p>
        </div>
      )}

      <LazyMapContainer
        center={mapPosition}
        zoom={initialZoom}
        markers={filteredLocations.map(location => ({
          position: [location.latitude, location.longitude] as [number, number],
          id: location.id || `loc-${location.latitude}-${location.longitude}`,
          title: location.name,
          icon: location.isDarkSkyReserve || location.certification ? 'dark-sky' : 'calculated',
          isSelected: location.id === selectedLocationId || 
                     `loc-${location.latitude}-${location.longitude}` === selectedLocationId,
          onClick: () => handleSelectLocationWrapper(location),
          popup: {
            title: location.name,
            description: location.isDarkSkyReserve
              ? t("Dark Sky Reserve", "暗夜保护区")
              : location.certification 
                ? t("Certified Location", "认证位置")
                : t("Calculated Viewing Location", "计算观测位置"),
            content: (
              <div className="flex flex-col space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {t("SIQS", "SIQS")}:
                  </span>
                  <div className="flex items-center">
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium`} 
                         style={{ backgroundColor: `${getProgressColor(location.siqs || 0)}30`, 
                                  color: getProgressColor(location.siqs || 0) }}>
                      {formatSIQSScore(location.siqs)}
                    </div>
                  </div>
                </div>
                {location.distance !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t("Distance", "距离")}:
                    </span>
                    <span className="text-xs">
                      {Math.round(location.distance)} km
                    </span>
                  </div>
                )}
                {currentSiqs && location.siqs && location.siqs > currentSiqs && (
                  <div className="text-xs text-green-500 font-medium">
                    {t("Better than current location", "优于当前位置")}
                  </div>
                )}
              </div>
            )
          }
        }))}
        userLocation={userLocation ? [userLocation.latitude, userLocation.longitude] : undefined}
        searchRadius={searchRadius}
        onMapReady={handleMapReady}
      />
    </div>
  );
};

export default PhotoPointsMap;
