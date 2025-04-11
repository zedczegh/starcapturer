
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsMap } from "@/hooks/photoPoints/usePhotoPointsMap";
import { toast } from "sonner";
import './MapStyles.css';
import { clearLocationCache } from "@/services/realTimeSiqsService/locationUpdateService";
import useMapInteractions from "@/hooks/photoPoints/useMapInteractions";
import MapDataLoader from "./loaders/MapDataLoader";
import { useMapState } from "@/hooks/photoPoints/useMapState";
import MapLocationLoader from "./MapLocationLoader";

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
  const mapInitializedRef = useRef(false);
  const previousViewRef = useRef<string>(activeView);
  const lastRadiusRef = useRef<number>(searchRadius);
  const prevLocationRef = useRef<{latitude: number; longitude: number} | null>(null);
  
  // Use the map state hook for better state management
  const {
    selectedMapLocation,
    mapLoadedOnce,
    key,
    combinedCalculatedLocations,
    loadingPhase,
    locationStats,
    updateLoadingPhase,
    forceMapReload,
    updateSelectedLocation,
    setMapLoaded,
    updateLocationStats,
    updateCombinedLocations
  } = useMapState();
  
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

  // Initialize by forcing certified locations to load on first render
  useEffect(() => {
    // Immediate force load of certified locations
    if (activeView === 'certified') {
      updateLoadingPhase('fetching');
      console.log("Forcing initial load of certified locations");
      
      // Reset the key to force remount of the map component
      forceMapReload('certified-initial');
    }
  }, []);
  
  // Force map remount when view changes
  useEffect(() => {
    if (previousViewRef.current !== activeView) {
      previousViewRef.current = activeView;
      forceMapReload(activeView);
      console.log(`View changed to ${activeView}, forcing map component remount`);
      
      updateLoadingPhase(activeView === 'certified' ? 'fetching' : 'processing');
    }
  }, [activeView, forceMapReload, updateLoadingPhase]);
  
  // Reset the cache when the radius changes significantly
  useEffect(() => {
    if (lastRadiusRef.current !== searchRadius && 
        Math.abs(lastRadiusRef.current - searchRadius) > 100) {
      console.log(`Search radius changed from ${lastRadiusRef.current}km to ${searchRadius}km, clearing cache`);
      clearLocationCache();
      
      updateLoadingPhase('fetching');
    }
    lastRadiusRef.current = searchRadius;
  }, [searchRadius, updateLoadingPhase]);

  // Handle significant location changes
  useEffect(() => {
    if (userLocation && prevLocationRef.current) {
      const latDiff = Math.abs(userLocation.latitude - prevLocationRef.current.latitude);
      const lngDiff = Math.abs(userLocation.longitude - prevLocationRef.current.longitude);
      
      if (latDiff > 0.5 || lngDiff > 0.5) {
        console.log("User location changed significantly");
        updateLoadingPhase('changing_location');
        
        prevLocationRef.current = userLocation;
        
        setTimeout(() => {
          updateLoadingPhase('ready');
        }, 2000);
      }
    } else if (userLocation) {
      prevLocationRef.current = userLocation;
    }
  }, [userLocation, updateLoadingPhase]);
  
  const {
    mapReady,
    handleMapReady,
    validLocations,
    mapCenter,
    initialZoom,
    certifiedLocationsLoaded,
    allCertifiedLocationsCount
  } = usePhotoPointsMap({
    userLocation: selectedMapLocation || userLocation,
    locations: activeView === 'certified' ? certifiedLocations : 
               combinedCalculatedLocations.length > 0 ? combinedCalculatedLocations : 
               calculatedLocations,
    searchRadius,
    activeView
  });

  // Update the user when certified locations finish loading
  useEffect(() => {
    if (certifiedLocationsLoaded && allCertifiedLocationsCount > 0 && activeView === 'certified') {
      console.log(`All ${allCertifiedLocationsCount} certified dark sky locations loaded globally`);
      toast.success(
        t(`Loaded ${allCertifiedLocationsCount} dark sky locations worldwide`, 
           `已加载全球${allCertifiedLocationsCount}个暗夜保护区`), 
        { duration: 3000 }
      );
    }
  }, [certifiedLocationsLoaded, allCertifiedLocationsCount, activeView, t]);

  // Reset selected location when user location changes significantly
  useEffect(() => {
    if (userLocation && selectedMapLocation) {
      const latDiff = Math.abs(userLocation.latitude - selectedMapLocation.latitude);
      const lngDiff = Math.abs(userLocation.longitude - selectedMapLocation.longitude);
      
      if (latDiff > 1 || lngDiff > 1) {
        console.log("User location changed significantly, updating selected location");
        updateSelectedLocation(null);
      }
    }
  }, [userLocation, selectedMapLocation, updateSelectedLocation]);

  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    updateSelectedLocation({ latitude: lat, longitude: lng });
      
    if (onLocationUpdate) {
      onLocationUpdate(lat, lng);
    }
  };

  return (
    <div className={className + " relative"}>
      <MapDataLoader 
        loading={loadingPhase !== 'ready'} 
        locationCount={validLocations.length}
        activeView={activeView}
        searchRadius={searchRadius}
        phase={loadingPhase}
      />
      
      <MapLocationLoader
        activeView={activeView}
        calculatedLocations={calculatedLocations}
        certifiedLocations={certifiedLocations}
        onLocationsProcessed={updateCombinedLocations}
        onLoadingPhaseChange={(phase) => updateLoadingPhase(phase)}
        onLocationStatsUpdate={(certifiedCount, calculatedCount) => 
          updateLocationStats(certifiedCount, calculatedCount)
        }
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
            setMapLoaded();
            updateLoadingPhase('ready');
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
