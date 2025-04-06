
import React, { useState, useCallback, useRef } from "react";
import { Suspense, lazy } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsMap } from "@/hooks/photoPoints/usePhotoPointsMap";

// Lazy load the map container to reduce initial load time
const LazyMapContainer = lazy(() => import('./LazyMapContainer'));

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
  
  // Use the hook to manage map state
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
    searchRadius,
    onLocationClick
  });

  return (
    <div className={className}>
      <Suspense fallback={
        <div className="h-full w-full flex items-center justify-center bg-background/20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t("Loading map...", "正在加载地图...")}
            </p>
          </div>
        </div>
      }>
        <LazyMapContainer
          center={mapCenter}
          userLocation={userLocation}
          locations={validLocations}
          searchRadius={searchRadius}
          onMapReady={() => {
            handleMapReady();
            if (onMapReady) onMapReady();
          }}
          onLocationClick={handleLocationClick}
        />
      </Suspense>
    </div>
  );
};

export default PhotoPointsMap;
