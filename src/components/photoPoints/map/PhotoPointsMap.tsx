
import React, { useCallback, useState } from "react";
import { Suspense, lazy } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsMap } from "@/hooks/photoPoints/usePhotoPointsMap";
import { toast } from "sonner";
import { calculateRealTimeSiqs } from "@/services/realTimeSiqsService";

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
  const [selectedMapLocation, setSelectedMapLocation] = useState<{latitude: number; longitude: number} | null>(null);
  
  const {
    mapReady,
    handleMapReady,
    handleLocationClick,
    validLocations,
    mapCenter,
    initialZoom
  } = usePhotoPointsMap({
    userLocation: selectedMapLocation || userLocation,
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
  
  // Handle map click to set a new calculation point
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setSelectedMapLocation({ latitude: lat, longitude: lng });
    
    // Show toast to inform the user
    toast.info(t(
      "Selected new location",
      "已选择新位置"
    ), {
      description: t(
        "Map will recenter on this location",
        "地图将重新以此位置为中心"
      )
    });
    
    // Try to calculate SIQS for this location in background
    try {
      const bortleScale = 4; // Default value
      await calculateRealTimeSiqs(lat, lng, bortleScale);
    } catch (error) {
      console.error("Error calculating SIQS for selected location:", error);
    }
  }, [t]);

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
          userLocation={selectedMapLocation || userLocation}
          locations={validLocations}
          searchRadius={searchRadius}
          onMapReady={handleMapReadyEvent}
          onLocationClick={handleLocationClickEvent}
          onMapClick={handleMapClick}
          zoom={initialZoom}
        />
      </Suspense>
    </div>
  );
};

export default PhotoPointsMap;
