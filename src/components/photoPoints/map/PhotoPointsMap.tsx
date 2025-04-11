
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsMap } from "@/hooks/photoPoints/usePhotoPointsMap";
import { toast } from "sonner";
import './MapStyles.css';
import { clearLocationCache } from "@/services/realTimeSiqsService/locationUpdateService";
import useMapInteractions from "@/hooks/photoPoints/useMapInteractions";

const RealTimeLocationUpdater = lazy(() => import('./RealTimeLocationUpdater'));
const LazyPhotoPointsMapContainer = lazy(() => import('./LazyMapContainer'));

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
  className = "h-[440px] w-full rounded-lg overflow-hidden border border-border"
}) => {
  const { t } = useLanguage();
  const [selectedMapLocation, setSelectedMapLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapLoadedOnce, setMapLoadedOnce] = useState(false);
  const mapInitializedRef = useRef(false);
  const previousViewRef = useRef<string>(activeView);
  const [key, setKey] = useState(`map-${Date.now()}`);
  const lastRadiusRef = useRef<number>(searchRadius);
  
  // Handle map interactions
  const {
    hoveredLocationId,
    handleMarkerHover,
    handleLocationClick: onMarkerClick,
    handleMapDragStart,
    handleMapDragEnd
  } = useMapInteractions({
    onLocationClick,
    onMarkerHover: (id) => console.log("Marker hover:", id)
  });
  
  // Always show only the active view locations, ensuring all certified locations are included
  const activeLocations = activeView === 'certified' ? certifiedLocations : calculatedLocations;
  
  // When view changes, mark it to trigger a re-render with a new key
  useEffect(() => {
    if (previousViewRef.current !== activeView) {
      previousViewRef.current = activeView;
      setKey(`map-view-${activeView}-${Date.now()}`);
      console.log(`View changed to ${activeView}, forcing map component remount`);
    }
  }, [activeView]);
  
  // Auto-clear cache when radius changes significantly
  useEffect(() => {
    if (lastRadiusRef.current !== searchRadius && 
        Math.abs(lastRadiusRef.current - searchRadius) > 100) {
      console.log(`Search radius changed from ${lastRadiusRef.current}km to ${searchRadius}km, clearing cache`);
      clearLocationCache();
    }
    lastRadiusRef.current = searchRadius;
  }, [searchRadius]);
  
  // Use the map hook with the selected location or user location
  const {
    mapReady,
    handleMapReady,
    validLocations,
    mapCenter,
    initialZoom
  } = usePhotoPointsMap({
    userLocation: selectedMapLocation || userLocation,
    locations: activeLocations,
    searchRadius,
    activeView
  });

  // Reset selected location when userLocation changes dramatically
  useEffect(() => {
    if (userLocation && selectedMapLocation) {
      const latDiff = Math.abs(userLocation.latitude - selectedMapLocation.latitude);
      const lngDiff = Math.abs(userLocation.longitude - selectedMapLocation.longitude);
      
      if (latDiff > 1 || lngDiff > 1) {
        console.log("User location changed significantly, updating selected location");
        setSelectedMapLocation(null);
      }
    }
  }, [userLocation, selectedMapLocation]);

  // Handle map click event
  const handleMapClick = (lat: number, lng: number) => {
    setSelectedMapLocation({ latitude: lat, longitude: lng });
      
    if (onLocationUpdate) {
      onLocationUpdate(lat, lng);
    }
  };

  return (
    <div className={className + " relative"}>
      <Suspense fallback={
        <div className="h-full w-full flex flex-col items-center justify-center bg-background/60">
          <Loader className="h-10 w-10 animate-spin mb-4 text-primary/70" />
          <p className="text-sm font-medium text-muted-foreground">
            {t("Loading map...", "加载地图中...")}
          </p>
        </div>
      }>
        <LazyPhotoPointsMapContainer
          key={key}
          center={mapCenter}
          zoom={initialZoom}
          userLocation={selectedMapLocation || userLocation}
          locations={validLocations}
          searchRadius={searchRadius}
          activeView={activeView}
          onMapReady={() => {
            handleMapReady();
            if (onMapReady) onMapReady();
            mapInitializedRef.current = true;
            setMapLoadedOnce(true);
          }}
          onLocationClick={onMarkerClick}
          onMapClick={handleMapClick}
          hoveredLocationId={hoveredLocationId}
          onMarkerHover={handleMarkerHover}
        />
        
        <Suspense fallback={null}>
          <RealTimeLocationUpdater 
            userLocation={selectedMapLocation || userLocation}
            onLocationUpdate={onLocationUpdate}
          />
        </Suspense>
      </Suspense>
    </div>
  );
};

export default PhotoPointsMap;
