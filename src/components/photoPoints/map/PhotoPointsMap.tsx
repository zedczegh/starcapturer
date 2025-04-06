
import React, { useCallback, useState, useEffect, useRef } from "react";
import { Suspense, lazy } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsMap } from "@/hooks/photoPoints/usePhotoPointsMap";
import { toast } from "sonner";
import './MapStyles.css'; // Import custom map styles
import RealTimeLocationUpdater from "./RealTimeLocationUpdater";
import { useMapMarkers } from "@/hooks/photoPoints/useMapMarkers";

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
  const lastClickTimeRef = useRef<number>(0);
  const clickTimeoutRef = useRef<number | null>(null);
  const { hoveredLocationId, handleHover } = useMapMarkers();
  const previousViewRef = useRef<string>(activeView);
  const viewChangedRef = useRef<boolean>(false);
  
  // Always show only the active view locations
  const activeLocations = activeView === 'certified' ? certifiedLocations : calculatedLocations;
  
  // When view changes, mark it to trigger a re-render
  useEffect(() => {
    if (previousViewRef.current !== activeView) {
      previousViewRef.current = activeView;
      viewChangedRef.current = true;
      
      // Fix for radius not updating correctly when switching views
      console.log(`View changed to ${activeView}, adjusting radius accordingly`);
    }
  }, [activeView]);
  
  // Always load certified locations in background as soon as component mounts
  useEffect(() => {
    if (!mapLoadedOnce && activeLocations.length > 0) {
      // Mark that we've done initial processing
      setMapLoadedOnce(true);
    }
  }, [activeLocations, mapLoadedOnce]);
  
  // Use the map hook with the selected location or user location
  const {
    mapReady,
    handleMapReady,
    handleLocationClick,
    validLocations,
    mapCenter,
    initialZoom
  } = usePhotoPointsMap({
    userLocation: selectedMapLocation || userLocation,
    locations: activeLocations, // Use only the active locations based on current view mode
    searchRadius
  });

  // Reset selected location when userLocation changes dramatically
  // This ensures we don't get stuck with an old selected location
  useEffect(() => {
    if (userLocation && selectedMapLocation) {
      const latDiff = Math.abs(userLocation.latitude - selectedMapLocation.latitude);
      const lngDiff = Math.abs(userLocation.longitude - selectedMapLocation.longitude);
      
      // If user location significantly changes, update the selected location
      if (latDiff > 1 || lngDiff > 1) {
        console.log("User location changed significantly, updating selected location");
        setSelectedMapLocation(null);
      }
    }
  }, [userLocation, selectedMapLocation]);

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
  
  // Handle map click to set a new calculation point with rate limiting and clearing timeout
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!mapInitializedRef.current) {
      console.log("Map not yet initialized, ignoring click");
      return;
    }
    
    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastClickTimeRef.current < 500) {
      console.log("Click too soon after last click, ignoring");
      return;
    }
    lastClickTimeRef.current = now;
    
    // Clear any existing click timeout
    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
    }
    
    // Update selected location immediately
    const newLocation = { latitude: lat, longitude: lng };
    setSelectedMapLocation(newLocation);
    
    // Call the location update callback after a short delay to prevent double-updating
    clickTimeoutRef.current = window.setTimeout(() => {
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
      clickTimeoutRef.current = null;
    }, 100);
    
  }, [t, onLocationUpdate]);

  // Handle direct location update from controls without debounce
  const handleDirectLocationUpdate = useCallback((lat: number, lng: number) => {
    setSelectedMapLocation({ latitude: lat, longitude: lng });
    
    if (onLocationUpdate) {
      onLocationUpdate(lat, lng);
    }
  }, [onLocationUpdate]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`${className} relative`}>
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
          locations={activeLocations} // Only show active view locations
          searchRadius={searchRadius}
          activeView={activeView} // Pass the active view to the map container
          onMapReady={handleMapReadyEvent}
          onLocationClick={handleLocationClickEvent}
          onMapClick={handleMapClick}
          zoom={initialZoom}
          key={`map-view-${activeView}`} // Add key to force re-render on view change
          hoveredLocationId={hoveredLocationId}
          onMarkerHover={handleHover}
        />
        
        <RealTimeLocationUpdater 
          userLocation={selectedMapLocation || userLocation}
          onLocationUpdate={handleDirectLocationUpdate}
          showControls={mapReady}
        />
      </Suspense>
    </div>
  );
};

export default PhotoPointsMap;
