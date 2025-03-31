
import React, { useCallback, memo, Suspense, lazy, useMemo, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { useMapReset } from "@/hooks/useMapReset";

// Lazy load the Leaflet map components to improve initial page load
const LazyMapComponent = lazy(() => import('./map/LazyMapComponent'));

interface MapDisplayProps {
  position: [number, number];
  locationName: string;
  editable?: boolean;
  onMapReady: () => void;
  onMapClick: (lat: number, lng: number) => void;
  showInfoPanel?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
}

const MapDisplay: React.FC<MapDisplayProps> = ({
  position,
  locationName,
  editable = false,
  onMapReady,
  onMapClick,
  showInfoPanel = false,
  isDarkSkyReserve = false,
  certification = ''
}) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapReadyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mapReadyHandledRef = useRef(false);

  // Memoize position to prevent unnecessary rerenders
  const memoizedPosition = useMemo(() => position, [position[0], position[1]]);
  
  // Format location name for display
  const displayName = useMemo(() => {
    // If the name is too long, truncate it for the map display
    if (locationName && locationName.length > 50) {
      return locationName.substring(0, 47) + '...';
    }
    return locationName;
  }, [locationName]);

  // Create markers array for the map
  const markers = useMemo(() => {
    return [{
      position: memoizedPosition,
      content: displayName
    }];
  }, [memoizedPosition, displayName]);

  // Create circles for dark sky reserves to indicate protected areas
  const circles = useMemo(() => {
    if (isDarkSkyReserve) {
      return [{
        center: memoizedPosition,
        radius: 15000, // 15km radius
        color: '#3b82f6',
        fillColor: '#3b82f680',
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.2
      }];
    }
    return [];
  }, [isDarkSkyReserve, memoizedPosition]);

  // Callback for map load completion
  const handleMapReady = useCallback(() => {
    if (!mapReadyHandledRef.current) {
      mapReadyHandledRef.current = true;
      onMapReady();
    }
  }, [onMapReady]);

  // Clean up any lingering timeouts
  useEffect(() => {
    return () => {
      if (mapReadyTimeoutRef.current) {
        clearTimeout(mapReadyTimeoutRef.current);
        mapReadyTimeoutRef.current = null;
      }
    };
  }, []);

  // Simulate map ready event after component mount with safety timeout
  useEffect(() => {
    mapReadyHandledRef.current = false;
    
    // Set a backup timeout to ensure onMapReady is called even if map initialization event fails
    mapReadyTimeoutRef.current = setTimeout(() => {
      handleMapReady();
    }, 1500);
    
    return () => {
      if (mapReadyTimeoutRef.current) {
        clearTimeout(mapReadyTimeoutRef.current);
        mapReadyTimeoutRef.current = null;
      }
    };
  }, [handleMapReady]);

  // Listen for map initialization event from child components
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleMapInitialized = () => {
      // Clear the timeout since we got the actual event
      if (mapReadyTimeoutRef.current) {
        clearTimeout(mapReadyTimeoutRef.current);
        mapReadyTimeoutRef.current = null;
      }
      
      handleMapReady();
    };
    
    container.addEventListener('map-initialized', handleMapInitialized);
    
    return () => {
      container.removeEventListener('map-initialized', handleMapInitialized);
    };
  }, [handleMapReady]);

  return (
    <div className="z-0 h-full w-full" ref={containerRef}>
      <Suspense fallback={
        <div className="h-full w-full flex items-center justify-center bg-cosmic-800/20">
          <div className="flex flex-col items-center gap-3">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-primary-foreground/90">{t("Loading map...", "正在加载地图...")}</p>
          </div>
        </div>
      }>
        <LazyMapComponent
          center={memoizedPosition}
          zoom={10}
          markers={markers}
          circles={circles}
          onMapClick={onMapClick}
          className="w-full h-full"
          scrollWheelZoom={true}
          attributionControl={true}
        />
      </Suspense>
    </div>
  );
};

export default memo(MapDisplay);
