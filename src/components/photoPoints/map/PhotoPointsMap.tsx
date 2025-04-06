
import React, { useCallback, useState, useEffect, useRef } from "react";
import { Suspense, lazy } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsMap } from "@/hooks/photoPoints/usePhotoPointsMap";
import { toast } from "sonner";
import { calculateRealTimeSiqs, batchCalculateSiqs } from "@/services/realTimeSiqsService";
import './MapStyles.css'; // Import custom map styles

// Lazy load the map container to reduce initial load time
const PhotoPointsMapContainer = lazy(() => import('./LazyMapContainer'));

interface PhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated'; 
  searchRadius: number;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMapReady?: () => void;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
  className?: string;
}

const PhotoPointsMap: React.FC<PhotoPointsMapProps> = ({
  userLocation,
  locations,
  certifiedLocations,
  calculatedLocations,
  activeView,
  searchRadius,
  onLocationClick,
  onMapReady,
  onLocationUpdate,
  className = "h-[600px] w-full rounded-lg overflow-hidden border border-border"
}) => {
  const { t } = useLanguage();
  const [selectedMapLocation, setSelectedMapLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapLoadedOnce, setMapLoadedOnce] = useState(false);
  const mapInitializedRef = useRef(false);
  
  // Always load certified locations in background as soon as component mounts
  useEffect(() => {
    if (!mapLoadedOnce && certifiedLocations.length > 0) {
      // Mark that we've done initial processing
      setMapLoadedOnce(true);
      
      // Calculate SIQS for all certified locations in batches to ensure they have scores
      batchCalculateSiqs(certifiedLocations, 3).then(updatedCertified => {
        console.log(`Processed ${updatedCertified.length} certified locations for map display`);
      }).catch(err => {
        console.error("Failed to process certified locations:", err);
      });
    }
  }, [certifiedLocations, mapLoadedOnce]);
  
  // Use the map hook
  const {
    mapReady,
    handleMapReady,
    handleLocationClick,
    validLocations,
    mapCenter,
    initialZoom
  } = usePhotoPointsMap({
    userLocation: selectedMapLocation || userLocation,
    locations: activeView === 'certified' ? certifiedLocations : calculatedLocations,
    searchRadius
  });

  // Callback for map being ready
  const handleMapReadyEvent = useCallback(() => {
    handleMapReady();
    if (onMapReady) onMapReady();
    mapInitializedRef.current = true;
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
    if (!mapInitializedRef.current) {
      console.log("Map not yet initialized, ignoring click");
      return;
    }
    
    // Update selected location immediately
    setSelectedMapLocation({ latitude: lat, longitude: lng });
    
    // Call the location update callback
    if (onLocationUpdate) {
      onLocationUpdate(lat, lng);
      
      // Show toast to inform the user
      toast.info(t(
        "Selected new location",
        "已选择新位置"
      ), {
        description: t(
          "Map will update to show locations around this point",
          "地图将更新以显示此点周围的位置"
        )
      });
    }
    
    // Try to calculate SIQS for this location in background
    try {
      const bortleScale = 4; // Default value
      await calculateRealTimeSiqs(lat, lng, bortleScale);
    } catch (error) {
      console.error("Error calculating SIQS for selected location:", error);
    }
  }, [t, onLocationUpdate]);

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
