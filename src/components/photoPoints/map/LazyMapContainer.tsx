
import React, { Suspense, lazy } from 'react';
import { SharedAstroSpot } from '@/types/weather';

// Import MapContent dynamically to reduce initial load time
const MapContent = lazy(() => import('./components/MapContent'));

interface LazyMapContainerProps {
  center: [number, number];
  zoom: number;
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onMapReady?: () => void;
  onLocationClick: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  hoveredLocationId: string | null;
  onMarkerHover: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  isMobile: boolean;
  useMobileMapFixer?: boolean;
  showRadiusCircles?: boolean;
  isForecastMode?: boolean;
  selectedForecastDay?: number;
}

const LazyMapContainer: React.FC<LazyMapContainerProps> = ({
  center,
  zoom,
  userLocation,
  locations,
  searchRadius,
  activeView,
  onMapReady,
  onLocationClick,
  onMapClick,
  hoveredLocationId,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  isMobile,
  useMobileMapFixer = false,
  showRadiusCircles = false,
  isForecastMode = false,
  selectedForecastDay = 0
}) => {
  // Create a wrapper function to adapt the onMapClick signature
  const handleMapClick = onMapClick ? (lat: number, lng: number) => {
    onMapClick(lat, lng);
  } : undefined;

  // Ensure safe defaults for the optional handlers
  const safeTouchStart = handleTouchStart || ((e: React.TouchEvent, id: string) => {});
  const safeTouchEnd = handleTouchEnd || ((e: React.TouchEvent, id: string | null) => {});
  const safeTouchMove = handleTouchMove || ((e: React.TouchEvent) => {});

  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <MapContent
        center={center}
        zoom={zoom}
        userLocation={userLocation}
        locations={locations}
        searchRadius={searchRadius}
        activeView={activeView}
        onMarkerHover={onMarkerHover}
        hoveredLocationId={hoveredLocationId}
        handleTouchStart={safeTouchStart}
        handleTouchEnd={safeTouchEnd}
        handleTouchMove={safeTouchMove}
        isMobile={isMobile}
        showRadiusCircles={showRadiusCircles}
        onLocationClick={onLocationClick}
        onMapClick={handleMapClick}
        isForecastMode={isForecastMode}
        selectedForecastDay={selectedForecastDay}
      />
      {onMapReady && setTimeout(onMapReady, 500)}
    </Suspense>
  );
};

export default LazyMapContainer;
