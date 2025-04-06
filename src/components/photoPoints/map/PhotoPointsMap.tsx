
import React, { useState, useEffect, useCallback } from "react";
import { Suspense, lazy } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

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
  const [mapReady, setMapReady] = useState(false);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
    if (onMapReady) onMapReady();
  }, [onMapReady]);

  // Handle location click event
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);

  // Check if locations are from the current user location
  const validLocations = locations.filter(location => location && 
    typeof location.latitude === 'number' && 
    typeof location.longitude === 'number');

  // Default to a central position if no user location
  const mapCenter: [number, number] = userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : [39.9042, 116.4074]; // Default center (Beijing)

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
        <LazyMapContainer
          center={mapCenter}
          userLocation={userLocation}
          locations={validLocations}
          searchRadius={searchRadius}
          onMapReady={handleMapReady}
          onLocationClick={handleLocationClick}
        />
      </Suspense>
    </div>
  );
};

export default PhotoPointsMap;
