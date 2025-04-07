
import React, { useCallback, useState, useEffect, useRef } from "react";
import { Suspense, lazy } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsMap } from "@/hooks/photoPoints/usePhotoPointsMap";
import { toast } from "sonner";
import './MarkerStyles.css'; // Import custom map styles
import { useMapMarkers } from "@/hooks/photoPoints/useMapMarkers";

// Create RealTimeLocationUpdater as a simple component without needing locationUpdate prop
const RealTimeLocationUpdater = ({ userLocation }: { userLocation: { latitude: number; longitude: number } | null }) => {
  // This component is now simplified - all it does is listen for location changes
  // and logs them without requiring any callbacks
  useEffect(() => {
    if (!userLocation) return;
    
    console.log(`Real-time location updated: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`);
  }, [userLocation]);
  
  return null;
};

// Lazy load the map container to reduce initial load time
const LazyPhotoPointsMapContainer = lazy(() => 
  import('./LazyMapContainer').then(module => {
    console.log("Map component loaded successfully");
    return module;
  })
);

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
  const { hoveredLocationId, handleHover, clearHoverOnMapInteraction } = useMapMarkers();
  const previousViewRef = useRef<string>(activeView);
  const viewChangedRef = useRef<boolean>(false);
  const [key, setKey] = useState(`map-${Date.now()}`); // Add key for forced remount when view changes
  
  // Always show only the active view locations
  const activeLocations = activeView === 'certified' ? certifiedLocations : calculatedLocations;
  
  // When view changes, mark it to trigger a re-render with a new key
  useEffect(() => {
    if (previousViewRef.current !== activeView) {
      previousViewRef.current = activeView;
      viewChangedRef.current = true;
      setKey(`map-view-${activeView}-${Date.now()}`);
      console.log(`View changed to ${activeView}, forcing map component remount`);
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
    console.log("Map is ready and initialized");
  }, [handleMapReady, onMapReady]);

  // Handle location click with callback if provided
  const handleLocationClickEvent = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    } else {
      handleLocationClick(location);
    }
  }, [onLocationClick, handleLocationClick]);
  
  // Handle map click to set a new calculation point with rate limiting
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
    
    // Clear any hover state
    clearHoverOnMapInteraction();
    
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
    
  }, [t, onLocationUpdate, clearHoverOnMapInteraction]);
  
  // Handle map interaction (click/drag) to clear hovering tooltips
  const handleMapInteraction = useCallback(() => {
    clearHoverOnMapInteraction();
  }, [clearHoverOnMapInteraction]);

  // Suspense fallback component
  const mapFallback = (
    <div className="h-full w-full flex items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-2">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <div className="text-sm text-muted-foreground">
          {t("Loading map...", "地图加载中...")}
        </div>
      </div>
    </div>
  );

  return (
    <div className={className}>
      <Suspense fallback={mapFallback}>
        <LazyPhotoPointsMapContainer
          key={key}
          center={mapCenter}
          zoom={initialZoom}
          userLocation={userLocation}
          locations={validLocations}
          searchRadius={searchRadius}
          activeView={activeView}
          onMapReady={handleMapReadyEvent}
          onLocationClick={handleLocationClickEvent}
          onMapClick={handleMapClick}
          onMapInteraction={handleMapInteraction}
          hoveredLocationId={hoveredLocationId}
          onMarkerHover={handleHover}
        />
      </Suspense>
      
      {/* Component to handle real-time location updates */}
      <RealTimeLocationUpdater userLocation={userLocation} />
    </div>
  );
};

export default PhotoPointsMap;
