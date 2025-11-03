import React, { useCallback, useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import './MarkerStyles.css';
import './MapStyles.css';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { configureLeaflet } from '@/components/location/map/MapMarkerUtils';
import { filterLocations, optimizeLocationsForMobile } from './MapUtils';
import RealTimeSiqsProvider from '../cards/RealTimeSiqsProvider';
import MapContent from './components/MapContent';

configureLeaflet();

interface LazyMapContainerProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated' | 'obscura' | 'mountains';
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
  
  console.log(`LazyMapContainer rendering with ${locations.length} locations, activeView: ${activeView}`);
  
  const handleUserLocationSiqs = useCallback((siqs: number | null, loading: boolean) => {
    if (!loading && siqs !== null) {
      setCurrentSiqs(siqs);
    }
  }, []);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    if (locations && locations.length > 0) {
      const locationIds = new Set(locations.map(loc => 
        `${loc.latitude?.toFixed(6)}-${loc.longitude?.toFixed(6)}`
      ));
      
      const previousToKeep = previousLocations.current.filter(loc => {
        const locId = `${loc.latitude?.toFixed(6)}-${loc.longitude?.toFixed(6)}`;
        return !locationIds.has(locId);
      });
      
      const combinedLocations = activeView === 'calculated' 
        ? [...locations, ...previousToKeep] 
        : locations;
      
      previousLocations.current = combinedLocations;
    }
  }, [locations, activeView]);
  
  const filteredLocations = useCallback(() => {
    if (!previousLocations.current || previousLocations.current.length === 0) {
      return locations || [];
    }
    
    const filtered = filterLocations(previousLocations.current, userLocation, searchRadius, activeView);
    return optimizeLocationsForMobile(filtered, Boolean(isMobile), activeView);
  }, [locations, userLocation, searchRadius, activeView, isMobile]);

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
      }, 300);
    };
    
    window.addEventListener('resize', handleResize);
    
    const timeoutId = setTimeout(() => {
      if (map) map.invalidateSize();
    }, 300);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      (window as any).leafletMap = mapRef.current;
      
      return () => {
        delete (window as any).leafletMap;
      };
    }
  }, [mapRef.current]);

  const displayLocations = filteredLocations();
  
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
        displayLocations={displayLocations}
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

export default React.memo(LazyMapContainer);
