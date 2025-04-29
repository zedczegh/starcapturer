
import React, { useState, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import MapContent from './components/MapContent';

interface LazyMapContainerProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  zoom: number;
  displayLocations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isMobile: boolean;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent<Element>, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent<Element>) => void;
  handleTouchMove?: (e: React.TouchEvent<Element>) => void;
  onMapReady?: () => void;
  showRadiusCircles?: boolean;
  currentSiqs: number | null;
  isForecast?: boolean;
}

const LazyMapContainer: React.FC<LazyMapContainerProps> = (props) => {
  const {
    center,
    userLocation,
    zoom,
    displayLocations,
    activeView,
    searchRadius,
    onLocationClick,
    onMapClick,
    isMobile,
    hoveredLocationId,
    onMarkerHover,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    onMapReady,
    showRadiusCircles = true,
    currentSiqs,
    isForecast = false
  } = props;
  
  const [mapVisible, setMapVisible] = useState(false);
  const mapRef = useRef<any>(null);
  
  React.useEffect(() => {
    // Short delay to ensure other components are rendered first
    const timer = setTimeout(() => {
      setMapVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // For performance optimization on mobile
  const useMobileMapFixer = isMobile && displayLocations.length > 50;
  
  const handleMapReadyComplete = () => {
    if (onMapReady) {
      onMapReady();
    }
    
    // Store the map object in the window for external access
    if (mapRef.current) {
      try {
        (window as any).leafletMap = mapRef.current;
      } catch (e) {
        console.error("Failed to store map in window object:", e);
      }
    }
  };
  
  console.log(`LazyMapContainer rendering with ${displayLocations.length} locations, activeView: ${activeView}`);
  
  if (!mapVisible) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-primary border-b-primary/30 border-l-primary/30 animate-spin"></div>
          <div className="mt-2 text-xs text-muted-foreground">Map loading...</div>
        </div>
      </div>
    );
  }
  
  return (
    <MapContent
      center={center}
      userLocation={userLocation}
      zoom={zoom}
      displayLocations={displayLocations}
      isMobile={isMobile}
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
      onMapReady={handleMapReadyComplete}
      currentSiqs={currentSiqs}
      isForecast={isForecast}
    />
  );
};

export default React.memo(LazyMapContainer);
