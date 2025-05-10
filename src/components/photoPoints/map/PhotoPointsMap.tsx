
import React, { useCallback, useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useIsMobile } from '@/hooks/use-mobile';
import LocationMarker from './LocationMarker';
import UserLocationMarker from './UserLocationMarker';
import 'leaflet/dist/leaflet.css';
import { useMapInteractions } from '@/hooks/photoPoints/useMapInteractions';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { getFastTileLayer, getTileLayerOptions } from '@/components/location/map/MapMarkerUtils';
import { usePhotoPointsMapContainer } from '@/hooks/photoPoints/usePhotoPointsMapContainer';

interface PhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  onLocationClick: (location: SharedAstroSpot) => void;
  onLocationUpdate: (latitude: number, longitude: number) => void;
  searchRadius: number;
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
}

// Maximum zoom level for performance
const MAX_ZOOM_LEVEL = 19;

// Simple error boundary HOC
const withErrorHandling = (Component: React.ComponentType<any>) => {
  return (props: any) => {
    try {
      return <Component {...props} />;
    } catch (error) {
      console.error("Map component error:", error);
      return (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          There was an error loading the map. Please try refreshing the page.
        </div>
      );
    }
  };
};

const PhotoPointsMapBase: React.FC<PhotoPointsMapProps> = (props) => {
  const { 
    userLocation, 
    locations,
    certifiedLocations, 
    calculatedLocations,
    onLocationClick, 
    onLocationUpdate,
    searchRadius,
    activeView
  } = props;
  
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [mapReady, setMapReady] = useState(false);
  const [mapMounted, setMapMounted] = useState(false);
  
  // Optimized map interactions using hooks
  const {
    hoveredLocationId,
    hideMarkerPopups,
    handleMarkerHover,
    handleLocationClick,
    handleMapDragStart,
    handleMapDragEnd
  } = useMapInteractions({
    onLocationClick
  });
  
  // Get optimized tile layer
  const { url: tileUrl } = getFastTileLayer();
  const tileOptions = getTileLayerOptions(isMobile);

  // Get consolidated map props from hook
  const {
    mapCenter,
    initialZoom,
    optimizedLocations,
    handleMapClick,
    handleMapReady: onMapReady,
    mapContainerHeight,
    legendOpen
  } = usePhotoPointsMapContainer({
    userLocation,
    locations,
    certifiedLocations,
    calculatedLocations,
    activeView,
    searchRadius,
    onLocationClick,
    onLocationUpdate
  });
  
  // Loading state for locations
  const [loadingState, setLoadingState] = useState({
    loading: true,
    progress: 0
  });
  
  // Update loading state based on locations
  useEffect(() => {
    if (locations.length > 0) {
      setLoadingState({
        loading: false,
        progress: 100
      });
    } else {
      setLoadingState({
        loading: true,
        progress: 50
      });
    }
  }, [locations]);
  
  // Handle marker touch events for mobile
  const [touchStartId, setTouchStartId] = useState<string | null>(null);
  const [isTouchMoving, setIsTouchMoving] = useState(false);
  
  const handleTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    setTouchStartId(id);
    setIsTouchMoving(false);
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setIsTouchMoving(true);
  }, []);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent, id: string | null) => {
    if (!isTouchMoving && id && id === touchStartId) {
      const location = optimizedLocations.find(loc => loc.id === id);
      if (location) {
        handleLocationClick(location);
      }
    }
    setTouchStartId(null);
  }, [isTouchMoving, touchStartId, optimizedLocations, handleLocationClick]);
  
  // Custom map ready handler
  const handleMapReady = useCallback(() => {
    console.log("PhotoPointsMap: Map is ready");
    setMapReady(true);
    if (onMapReady) {
      onMapReady();
    }
  }, [onMapReady]);
  
  // Component mount handler
  useEffect(() => {
    setMapMounted(true);
    return () => setMapMounted(false);
  }, []);
  
  // Notify failure after timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!mapReady && mapMounted) {
        console.warn("Map failed to load within timeout period");
        toast.error(t("Map is taking longer than expected to load", "地图加载时间超过预期"));
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [mapReady, mapMounted, t]);
  
  // Map event handlers and positioning
  const MapController = () => {
    const map = useMap();
    
    useEffect(() => {
      // Register drag handlers
      map.on('dragstart', handleMapDragStart);
      map.on('dragend', handleMapDragEnd);
      
      // Register click handler for location update
      if (activeView === 'calculated') {
        map.on('click', (e) => {
          if (handleMapClick) {
            handleMapClick(e.latlng.lat, e.latlng.lng);
          }
        });
      }
      
      // Set up map
      handleMapReady();
      
      return () => {
        map.off('dragstart', handleMapDragStart);
        map.off('dragend', handleMapDragEnd);
        if (handleMapClick) {
          map.off('click');
        }
      };
    }, [map]);
    
    // Update center when user location changes
    useEffect(() => {
      if (mapCenter && map && mapReady) {
        map.setView(mapCenter, map.getZoom(), { animate: true });
      }
    }, [mapCenter?.[0], mapCenter?.[1]]);
    
    return null;
  };
  
  // Determine which user location to show (actual or center of China)
  const effectiveUserLocation = userLocation 
    ? [userLocation.latitude, userLocation.longitude] as [number, number]
    : [35.8617, 104.1954] as [number, number];  // Default center (China)
  
  return (
    <div className="relative w-full h-[50vh] md:h-[60vh] rounded-xl overflow-hidden border border-border/40">
      {locations.length === 0 && loadingState.loading && (
        <div className="absolute inset-0 z-10 bg-background/80 flex flex-col items-center justify-center">
          <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${loadingState.progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t("Loading locations...", "正在加载位置...")} ({loadingState.progress}%)
          </p>
        </div>
      )}
      
      <MapContainer
        center={mapCenter}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer 
          url={tileOptions.url} 
          maxZoom={MAX_ZOOM_LEVEL} 
        />
        
        <MapController />
        
        {mapReady && userLocation && (
          <UserLocationMarker 
            position={[userLocation.latitude, userLocation.longitude]} 
            onLocationUpdate={onLocationUpdate}
          />
        )}
        
        {!hideMarkerPopups && optimizedLocations.map(location => (
          <LocationMarker
            key={`${location.id || location.name}-${location.latitude.toFixed(5)}-${location.longitude.toFixed(5)}`}
            location={location}
            onClick={handleLocationClick}
            isHovered={hoveredLocationId === location.id}
            onHover={handleMarkerHover}
            locationId={location.id || `${location.latitude}-${location.longitude}`}
            isCertified={Boolean(location.isDarkSkyReserve || location.certification)}
            activeView={activeView}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
            handleTouchMove={handleTouchMove}
          />
        ))}
      </MapContainer>
    </div>
  );
};

// Apply error handling HOC
const PhotoPointsMap = withErrorHandling(PhotoPointsMapBase);

export default React.memo(PhotoPointsMap);
