
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsMap } from "@/hooks/photoPoints/usePhotoPointsMap";
import './MapStyles.css';
import { clearLocationCache } from "@/services/realTimeSiqsService/locationUpdateService";
import useMapInteractions from "@/hooks/photoPoints/useMapInteractions";
import { getAllStoredLocations } from "@/services/calculatedLocationsService";
import MapLegend from "./MapLegend";
import LoadingIndicator from "./LoadingIndicator";

// Lazy load map components to reduce initial load time
const RealTimeLocationUpdater = lazy(() => import('./RealTimeLocationUpdater'));
const LazyPhotoPointsMapContainer = lazy(() => 
  import('./LazyMapContainer').then(module => {
    // Add a small delay to ensure DOM is ready before rendering the map
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(module);
      }, 50);
    });
  })
);

// Fallback component for when map is loading
const MapLoadingFallback = () => (
  <div className="w-full h-full flex items-center justify-center bg-cosmic-900/70">
    <div className="animate-pulse text-primary/70">Loading map...</div>
  </div>
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
  className = "h-[440px] w-full rounded-lg overflow-hidden border border-border"
}) => {
  const { t } = useLanguage();
  const [selectedMapLocation, setSelectedMapLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapLoadedOnce, setMapLoadedOnce] = useState(false);
  const [mapError, setMapError] = useState<Error | null>(null);
  const mapInitializedRef = useRef(false);
  const previousViewRef = useRef<string>(activeView);
  const [key, setKey] = useState(`map-${Date.now()}`);
  const lastRadiusRef = useRef<number>(searchRadius);
  const prevLocationRef = useRef<{latitude: number; longitude: number} | null>(null);
  const [combinedCalculatedLocations, setCombinedCalculatedLocations] = useState<SharedAstroSpot[]>([]);
  const [loadingPhase, setLoadingPhase] = useState<'initial' | 'fetching' | 'processing' | 'ready' | 'changing_location'>('initial');
  const [locationStats, setLocationStats] = useState<{certified: number, calculated: number}>({ certified: 0, calculated: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
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

  // Process calculated locations when they change
  useEffect(() => {
    if (activeView === 'calculated') {
      const storedLocations = getAllStoredLocations();
      
      setLoadingPhase('processing');
      
      const locMap = new Map<string, SharedAstroSpot>();
      
      // Ensure calculatedLocations is an array before processing
      const locationsToProcess = Array.isArray(calculatedLocations) ? calculatedLocations : [];
      
      locationsToProcess.forEach(loc => {
        if (loc && loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locMap.set(key, loc);
        }
      });
      
      storedLocations.forEach(loc => {
        if (loc && loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          if (!locMap.has(key)) {
            locMap.set(key, loc);
          }
        }
      });
      
      const combined = Array.from(locMap.values());
      setCombinedCalculatedLocations(combined);
      setLocationStats(prev => ({ ...prev, calculated: combined.length }));
      
      console.log(`Combined ${locationsToProcess.length} current locations with ${storedLocations.length} stored locations for a total of ${combined.length} unique locations`);
      
      setTimeout(() => {
        setLoadingPhase('ready');
      }, 500);
    }
  }, [calculatedLocations, activeView]);
  
  const activeLocations = activeView === 'certified' 
    ? (Array.isArray(certifiedLocations) ? certifiedLocations : [])
    : (combinedCalculatedLocations.length > 0 ? combinedCalculatedLocations : 
       (Array.isArray(calculatedLocations) ? calculatedLocations : []));
  
  // Handle view change (certified vs calculated)
  useEffect(() => {
    if (previousViewRef.current !== activeView) {
      previousViewRef.current = activeView;
      setKey(`map-view-${activeView}-${Date.now()}`);
      console.log(`View changed to ${activeView}, forcing map component remount`);
      
      setLoadingPhase(activeView === 'certified' ? 'fetching' : 'processing');
    }
  }, [activeView]);
  
  // Handle search radius change
  useEffect(() => {
    if (lastRadiusRef.current !== searchRadius && 
        Math.abs(lastRadiusRef.current - searchRadius) > 100) {
      console.log(`Search radius changed from ${lastRadiusRef.current}km to ${searchRadius}km, clearing cache`);
      clearLocationCache();
      
      setLoadingPhase('fetching');
    }
    lastRadiusRef.current = searchRadius;
  }, [searchRadius]);

  // Track significant location changes
  useEffect(() => {
    if (userLocation && prevLocationRef.current) {
      const latDiff = Math.abs(userLocation.latitude - prevLocationRef.current.latitude);
      const lngDiff = Math.abs(userLocation.longitude - prevLocationRef.current.longitude);
      
      if (latDiff > 0.5 || lngDiff > 0.5) {
        console.log("User location changed significantly");
        setLoadingPhase('changing_location');
        
        prevLocationRef.current = userLocation;
        
        setTimeout(() => {
          setLoadingPhase('ready');
        }, 1000);
      }
    } else if (userLocation) {
      prevLocationRef.current = userLocation;
    }
  }, [userLocation]);
  
  const {
    mapReady,
    handleMapReady,
    validLocations,
    mapCenter,
    initialZoom,
    certifiedLocationsLoaded,
    certifiedLocationsLoading,
    loadingProgress,
    allCertifiedLocationsCount
  } = usePhotoPointsMap({
    userLocation: selectedMapLocation || userLocation,
    locations: activeLocations,
    searchRadius,
    activeView
  });

  // Show success message when certified locations are loaded, but as console log instead of toast
  useEffect(() => {
    if (certifiedLocationsLoaded && allCertifiedLocationsCount > 0 && activeView === 'certified') {
      console.log(`All ${allCertifiedLocationsCount} certified dark sky locations loaded globally`);
    }
  }, [certifiedLocationsLoaded, allCertifiedLocationsCount, activeView, t]);

  // Reset selected location if user location changes significantly
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

  // Error boundary recovery
  useEffect(() => {
    if (mapError) {
      const timer = setTimeout(() => {
        setMapError(null);
        setKey(`map-recovery-${Date.now()}`);
        console.log("Recovering from map error");
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [mapError]);

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedMapLocation({ latitude: lat, longitude: lng });
      
    if (onLocationUpdate) {
      onLocationUpdate(lat, lng);
    }
  };

  // Handle map error
  const handleMapError = (error: Error) => {
    console.error("Map error:", error);
    setMapError(error);
  };

  // Show loading indicator while certified locations are loading
  const showLoadingIndicator = activeView === 'certified' && certifiedLocationsLoading && !mapLoadedOnce;

  return (
    <div className="space-y-3">
      <div className={className + " relative"} ref={mapContainerRef}>
        {showLoadingIndicator && (
          <LoadingIndicator 
            progress={loadingProgress}
            message={t(
              "Loading certified dark sky locations...", 
              "正在加载全球认证暗夜保护区..."
            )}
          />
        )}
        
        <Suspense fallback={<MapLoadingFallback />}>
          {mapError ? (
            <div className="w-full h-full flex items-center justify-center bg-cosmic-900/70">
              <div className="text-red-400 text-center p-4">
                <p>Map error. Retrying...</p>
              </div>
            </div>
          ) : (
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
          )}
          
          <RealTimeLocationUpdater 
            userLocation={selectedMapLocation || userLocation}
            onLocationUpdate={onLocationUpdate}
          />
        </Suspense>
      </div>
      
      <div className="px-1">
        <MapLegend
          showStarLegend={activeView === 'certified'}
          showCircleLegend={activeView === 'calculated'}
          className="max-w-md mx-auto text-sm"
        />
      </div>
    </div>
  );
};

export default PhotoPointsMap;
