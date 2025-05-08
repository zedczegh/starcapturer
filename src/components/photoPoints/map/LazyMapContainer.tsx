
import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import 'leaflet/dist/leaflet.css';
import './MarkerStyles.css';
import './MapStyles.css';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { configureLeaflet } from '@/components/location/map/MapMarkerUtils';
import { filterLocations, optimizeLocationsForMobile } from './MapUtils';
import RealTimeSiqsProvider from '../cards/RealTimeSiqsProvider';
import MapContent from './components/MapContent';

// Configure Leaflet immediately
configureLeaflet();

interface LazyMapContainerProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onMapReady?: () => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  zoom?: number;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  isMobile?: boolean;
  useMobileMapFixer?: boolean;
  showRadiusCircles?: boolean;
}

const LazyMapContainer: React.FC<LazyMapContainerProps> = ({
  center,
  userLocation,
  locations,
  searchRadius,
  activeView,
  onMapReady,
  onLocationClick,
  onMapClick,
  zoom = 10,
  hoveredLocationId,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  isMobile,
  useMobileMapFixer = false,
  showRadiusCircles = false
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const previousLocations = useRef<SharedAstroSpot[]>([]);
  const [optimizedLocations, setOptimizedLocations] = useState<SharedAstroSpot[]>([]);
  
  // Pre-compute the locations only when the actual dependencies change
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const filtered = filterLocations(
      locations || [],
      userLocation, 
      searchRadius,
      activeView
    );
    
    const optimized = optimizeLocationsForMobile(
      filtered, 
      Boolean(isMobile), 
      activeView
    );
    
    setOptimizedLocations(optimized);
    
  }, [locations, userLocation, searchRadius, activeView, isMobile]);
  
  // Handle component lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const handleUserLocationSiqs = useCallback((siqs: number | null, loading: boolean) => {
    if (!loading && siqs !== null) {
      setCurrentSiqs(siqs);
    }
  }, []);
  
  // Improve map handling to avoid unnecessary reloads
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    let resizeTimeout: number | null = null;
    const handleResize = () => {
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(() => {
        if (map) map.invalidateSize();
        resizeTimeout = null;
      }, 200);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Ensure map is properly sized
    if (isMobile) {
      // Mobile devices often need multiple invalidation attempts
      const timeoutIds = [
        setTimeout(() => { if (map) map.invalidateSize(); }, 100),
        setTimeout(() => { if (map) map.invalidateSize(); }, 500),
        setTimeout(() => { if (map) map.invalidateSize(); }, 1500)
      ];
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeTimeout) window.clearTimeout(resizeTimeout);
        timeoutIds.forEach(clearTimeout);
      };
    } else {
      const timeoutId = setTimeout(() => {
        if (map) map.invalidateSize();
      }, 300);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeTimeout) window.clearTimeout(resizeTimeout);
        clearTimeout(timeoutId);
      };
    }
  }, [isMobile]);
  
  // Export map instance for debugging
  useEffect(() => {
    if (mapRef.current) {
      (window as any).leafletMap = mapRef.current;
      
      return () => {
        delete (window as any).leafletMap;
      };
    }
  }, [mapRef.current]);
  
  const handleMapReady = useCallback(() => {
    setMapReady(true);
    if (onMapReady) onMapReady();
  }, [onMapReady]);

  return (
    <div ref={mapContainerRef} className="relative w-full h-full">
      {userLocation && (
        <RealTimeSiqsProvider
          isVisible={true}
          latitude={userLocation.latitude}
          longitude={userLocation.longitude}
          bortleScale={4}
          onSiqsCalculated={handleUserLocationSiqs}
        />
      )}
      
      <MapContent 
        center={center}
        userLocation={userLocation}
        zoom={zoom}
        displayLocations={optimizedLocations}
        isMobile={Boolean(isMobile)}
        activeView={activeView}
        searchRadius={searchRadius}
        showRadiusCircles={showRadiusCircles}
        onMapClick={onMapClick}
        onLocationClick={onLocationClick}
        hoveredLocationId={hoveredLocationId}
        onMarkerHover={onMarkerHover}
        handleTouchStart={handleTouchStart}
        handleTouchEnd={handleTouchEnd}
        handleTouchMove={handleTouchMove}
        useMobileMapFixer={useMobileMapFixer}
        mapRef={mapRef}
        onMapReady={handleMapReady}
        currentSiqs={currentSiqs}
      />
    </div>
  );
};

// Memoize to avoid unnecessary rerenders
export default memo(LazyMapContainer);
