import React, { useCallback, useState, useEffect, useRef } from "react";
import { Suspense, lazy } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader, MapPin } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsMap } from "@/hooks/photoPoints/usePhotoPointsMap";
import { toast } from "sonner";
import './MapStyles.css'; // Import custom map styles
import RealTimeLocationUpdater from "./RealTimeLocationUpdater";
import { useMapMarkers } from "@/hooks/photoPoints/useMapMarkers";
import { clearLocationCache } from "@/services/realTimeSiqsService/locationUpdateService";
import { Button } from "@/components/ui/button";

// Lazy load the map container to reduce initial load time
const LazyPhotoPointsMapContainer = lazy(() => 
  import('./LazyMapContainer').then(module => {
    console.log("Map component loaded successfully");
    return module;
  })
);

// Create custom CSS for map controls positioning
const injectMapControlsCss = () => {
  if (typeof document === "undefined") return;
  
  if (!document.getElementById('map-controls-styles')) {
    const style = document.createElement('style');
    style.id = 'map-controls-styles';
    style.innerHTML = `
      .photo-points-map .leaflet-bottom.leaflet-right {
        bottom: 20px;
        right: 20px;
      }
      
      .my-location-control {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 1000;
      }
      
      .circle-overlay {
        stroke: #8b5cf6;
        stroke-width: 1.5;
        fill: #8b5cf6;
        fill-opacity: 0.08;
        stroke-opacity: 0.5;
      }
    `;
    document.head.appendChild(style);
  }
};

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
  const [key, setKey] = useState(`map-${Date.now()}`); // Add key for forced remount when view changes
  const lastRadiusRef = useRef<number>(searchRadius);
  const previousLocationsRef = useRef<SharedAstroSpot[]>([]);
  
  // Inject custom CSS for map controls positioning
  useEffect(() => {
    injectMapControlsCss();
  }, []);
  
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
  
  // Auto-clear cache when radius changes significantly
  useEffect(() => {
    if (lastRadiusRef.current !== searchRadius && 
        Math.abs(lastRadiusRef.current - searchRadius) > 100) {
      // Radius has changed significantly, clear cache
      console.log(`Search radius changed from ${lastRadiusRef.current}km to ${searchRadius}km, clearing cache`);
      clearLocationCache();
      lastRadiusRef.current = searchRadius;
    } else {
      lastRadiusRef.current = searchRadius;
    }
  }, [searchRadius]);
  
  // Process locations to keep track of all loaded locations across radius changes
  useEffect(() => {
    if (activeView === 'calculated' && activeLocations.length > 0) {
      // For calculated view, preserve all previously loaded locations
      previousLocationsRef.current = [
        ...previousLocationsRef.current,
        ...activeLocations.filter(newLoc => {
          // Only add if not already in the list
          return !previousLocationsRef.current.some(existingLoc => 
            existingLoc.latitude === newLoc.latitude && 
            existingLoc.longitude === newLoc.longitude
          );
        })
      ];
    }
  }, [activeLocations, activeView]);
  
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
    locations: activeView === 'calculated' && previousLocationsRef.current.length > 0 
      ? previousLocationsRef.current 
      : activeLocations,
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
        previousLocationsRef.current = []; // Reset accumulated locations
      }
    }
  }, [userLocation, selectedMapLocation]);

  // Handle map click event
  const handleMapClick = useCallback((lat: number, lng: number) => {
    const now = Date.now();
    
    // Prevent double clicks by checking time since last click
    if (now - lastClickTimeRef.current < 300) {
      console.log("Ignoring rapid click");
      return;
    }
    
    lastClickTimeRef.current = now;
    
    // Clear any existing click timeout
    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
    }
    
    // Set a slight delay to allow for popups to close first
    clickTimeoutRef.current = window.setTimeout(() => {
      // Update selected location
      setSelectedMapLocation({ latitude: lat, longitude: lng });
      
      // Reset previous locations when changing location manually
      previousLocationsRef.current = [];
      
      // Clear location cache to force fresh data for the new location
      clearLocationCache();
      
      // Notify parent component
      if (onLocationUpdate) {
        onLocationUpdate(lat, lng);
      }
      
      clickTimeoutRef.current = null;
      
      // Show toast to indicate location update
      toast.info(t(
        "Updating to selected location...",
        "正在更新到所选位置..."
      ));
    }, 100);
  }, [onLocationUpdate, t]);

  // Clear hoveredLocationId when user is interacting with the map
  const clearHover = useCallback(() => {
    handleHover(null);
  }, [handleHover]);

  // Handle reset to user's actual location
  const handleResetToCurrentLocation = useCallback(() => {
    setSelectedMapLocation(null);
    previousLocationsRef.current = [];
    clearLocationCache();
    
    if (userLocation) {
      toast.info(t(
        "Returning to your current location...",
        "返回到您的当前位置..."
      ));
    } else {
      toast.info(t(
        "Getting your location...",
        "获取您的位置中..."
      ));
    }
  }, [userLocation, t]);

  return (
    <div className={`relative photo-points-map ${className}`}>
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
          userLocation={userLocation}
          mapCenter={mapCenter}
          initialZoom={initialZoom}
          locations={validLocations}
          hoveredLocationId={hoveredLocationId}
          onLocationClick={handleLocationClick}
          onMapClick={handleMapClick}
          onMapReady={handleMapReady}
          clearHover={clearHover}
          handleHover={handleHover}
          searchRadius={activeView === 'calculated' ? searchRadius : 0}
          showRadiusCircle={activeView === 'calculated'}
          selectedLocation={selectedMapLocation || userLocation}
          activeView={activeView}
          certifiedLocations={certifiedLocations}
        />
        
        {/* "My Location" button positioned outside the map */}
        <Button 
          variant="secondary"
          size="sm"
          onClick={handleResetToCurrentLocation}
          className="my-location-control shadow-md flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm hover:bg-background/90"
        >
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm">{t("My Location", "我的位置")}</span>
        </Button>
        
        {/* Real-time location updater for auto-refresh */}
        {userLocation && (
          <RealTimeLocationUpdater
            userLocation={userLocation}
            onLocationUpdate={onLocationUpdate}
          />
        )}
      </Suspense>
    </div>
  );
};

export default PhotoPointsMap;
