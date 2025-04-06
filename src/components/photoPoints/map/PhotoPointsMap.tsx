
import React, { useCallback } from "react";
import { Suspense, lazy } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsMap } from "@/hooks/photoPoints/usePhotoPointsMap";

// Lazy load the map container to reduce initial load time
const PhotoPointsMapContainer = lazy(() => import('./LazyMapContainer'));

interface PhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMapReady?: () => void;
  className?: string;
}

const PhotoPointsMap: React.FC<PhotoPointsMapProps> = ({
  userLocation,
  locations,
  searchRadius,
  onLocationClick,
  onMapReady,
  className = "h-[500px] w-full rounded-lg overflow-hidden border border-border"
}) => {
  const { t } = useLanguage();
  const {
    mapReady,
    handleMapReady,
    handleLocationClick,
    validLocations,
    mapCenter,
    initialZoom
  } = usePhotoPointsMap({
    userLocation,
    locations,
    searchRadius
  });

  // Callback for map being ready
  const handleMapReadyEvent = useCallback(() => {
    handleMapReady();
    if (onMapReady) onMapReady();
  }, [handleMapReady, onMapReady]);

  // Handle location click with callback if provided
  const handleLocationClickEvent = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    } else {
      handleLocationClick(location);
    }
  }, [onLocationClick, handleLocationClick]);

  return (
    <div className={className}>
      <Suspense fallback={
        <div className="h-full w-full flex items-center justify-center bg-background/20">
          <div className="flex flex-col items-center gap-3">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t("Loading map...", "正在加载地图...")}
            </p>
          </div>
        </div>
      }>
        <PhotoPointsMapContainer
          center={mapCenter}
          userLocation={userLocation}
          locations={validLocations}
          searchRadius={searchRadius}
          onMapReady={handleMapReadyEvent}
          onLocationClick={handleLocationClickEvent}
          zoom={initialZoom}
        />
      </Suspense>
    </div>
  );
};

export default PhotoPointsMap;
