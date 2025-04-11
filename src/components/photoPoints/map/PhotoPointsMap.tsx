import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsMap } from "@/hooks/photoPoints/usePhotoPointsMap";
import { toast } from "sonner";
import './MapStyles.css';
import { clearLocationCache } from "@/services/realTimeSiqsService/locationUpdateService";
import useMapInteractions from "@/hooks/photoPoints/useMapInteractions";
import { getAllStoredLocations } from "@/services/calculatedLocationsService";
import MapDataLoader from "./loaders/MapDataLoader";

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
  const prevLocationRef = useRef<{latitude: number; longitude: number} | null>(null);
  const [combinedCalculatedLocations, setCombinedCalculatedLocations] = useState<SharedAstroSpot[]>([]);
  const [loadingPhase, setLoadingPhase] = useState<'initial' | 'fetching' | 'processing' | 'ready' | 'changing_location'>('initial');
  
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

  // Merge provided calculated locations with stored ones
  useEffect(() => {
    if (activeView === 'calculated') {
      // Get all stored locations from the global store
      const storedLocations = getAllStoredLocations();
      
      // Set loading phase for loader UI
      setLoadingPhase('processing');
      
      // Merge with current calculated locations without duplicates
      const locMap = new Map<string, SharedAstroSpot>();
      
      // First add current calculated locations
      calculatedLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locMap.set(key, loc);
        }
      });
      
      // Then add stored locations that don't already exist
      storedLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          if (!locMap.has(key)) {
            locMap.set(key, loc);
          }
        }
      });
      
      const combined = Array.from(locMap.values());
      setCombinedCalculatedLocations(combined);
      
      console.log(`Combined ${calculatedLocations.length} current locations with ${storedLocations.length} stored locations for a total of ${combined.length} unique locations`);
      
      // Set loading phase to ready after processing
      setTimeout(() => {
        setLoadingPhase('ready');
      }, 500);
    }
  }, [calculatedLocations, activeView]);
  
  // Always show only the active view locations, ensuring all certified locations are included
  const activeLocations = activeView === 'certified' ? certifiedLocations : combinedCalculatedLocations.length > 0 ? combinedCalculatedLocations : calculatedLocations;
  
  // When view changes, mark it to trigger a re-render with a new key
  useEffect(() => {
    if (previousViewRef.current !== activeView) {
      previousViewRef.current = activeView;
      setKey(`map-view-${activeView}-${Date.now()}`);
      console.log(`View changed to ${activeView}, forcing map component remount`);
      
      // Set loading state for view change
      setLoadingPhase(activeView === 'certified' ? 'fetching' : 'processing');
    }
  }, [activeView]);
  
  // Auto-clear cache when radius changes significantly
  useEffect(() => {
    if (lastRadiusRef.current !== searchRadius && 
        Math.abs(lastRadiusRef.current - searchRadius) > 100) {
      console.log(`Search radius changed from ${lastRadiusRef.current}km to ${searchRadius}km, clearing cache`);
      clearLocationCache();
      
      // Update loading phase for radius change
      setLoadingPhase('fetching');
    }
    lastRadiusRef.current = searchRadius;
  }, [searchRadius]);

  // Check if location has changed significantly
  useEffect(() => {
    if (userLocation && prevLocationRef.current) {
      const latDiff = Math.abs(userLocation.latitude - prevLocationRef.current.latitude);
      const lngDiff = Math.abs(userLocation.longitude - prevLocationRef.current.longitude);
      
      if (latDiff > 0.5 || lngDiff > 0.5) {
        console.log("User location changed significantly");
        setLoadingPhase('changing_location');
        
        // Don't clear the cache to keep existing locations, just update the ref
        prevLocationRef.current = userLocation;
        
        // Reset to ready after a short delay
        setTimeout(() => {
          setLoadingPhase('ready');
        }, 2000);
      }
    } else if (userLocation) {
      prevLocationRef.current = userLocation;
    }
  }, [userLocation]);
  
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
      {/* Loading overlay - always shows regardless of lazy loading state */}
      <MapDataLoader 
        loading={loadingPhase !== 'ready'} 
        locationCount={validLocations.length}
        activeView={activeView}
        searchRadius={searchRadius}
        phase={loadingPhase}
      />
      
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
            setLoadingPhase('ready');
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
