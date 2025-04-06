
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Loader2 } from 'lucide-react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { SiqsScoreBadge } from '@/components/photoPoints/cards/SiqsScoreBadge';
import LazyMapContainer from './LazyMapContainer';
import { formatSIQSScore } from '@/utils/geoUtils';

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
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Handle map ready event
  const handleMapReady = useCallback(() => {
    setMapLoaded(true);
  }, []);

  // Handle location selection
  const handleLocationSelect = useCallback((location: SharedAstroSpot) => {
    setSelectedLocationId(location.id || `loc-${location.latitude}-${location.longitude}`);
    onSelectLocation(location);
  }, [onSelectLocation]);

  // Prepare map center position
  const mapPosition = useMemo(() => {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude] as [number, number];
    }
    // Default position if no user location
    return [39.9, 116.3] as [number, number];
  }, [userLocation]);

  // Calculate initial zoom level based on search radius
  const initialZoom = useMemo(() => {
    if (searchRadius <= 200) return 9;
    if (searchRadius <= 500) return 7;
    if (searchRadius <= 1000) return 6;
    if (searchRadius <= 3000) return 5;
    return 4;
  }, [searchRadius]);

  // Filter locations to only show ones with better SIQS than current
  const filteredLocations = useMemo(() => {
    if (!currentSiqs) return locations;
    
    // Include all certified locations and calculated locations with higher SIQS
    return locations.filter(loc => 
      loc.isDarkSkyReserve || 
      loc.certification || 
      (loc.siqs && loc.siqs > currentSiqs)
    );
  }, [locations, currentSiqs]);

  return (
    <div className="relative h-[400px] md:h-[500px] w-full rounded-lg overflow-hidden border border-border/30 bg-background/50">
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
          onClick: () => handleLocationSelect(location),
          popup: {
            title: location.name,
            description: location.isDarkSkyReserve
              ? t("Dark Sky Reserve", "暗夜保护区")
              : location.certification 
                ? t("Certified Location", "认证位置")
                : t("Calculated Viewing Location", "计算观测位置"),
            content: (
              <div className="flex flex-col space-y-1 pt-1">
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground mr-2">
                    {t("SIQS", "SIQS")}:
                  </span>
                  <span className="text-sm font-medium text-yellow-500">
                    {formatSIQSScore(location.siqs)}
                  </span>
                </div>
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
