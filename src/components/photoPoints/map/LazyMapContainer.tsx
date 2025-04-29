
import React, { useState, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import MapContent from './components/MapContent';

interface LazyMapContainerProps {
  center: [number, number];
  zoom: number;
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onMapReady: () => void;
  onLocationClick: (location: SharedAstroSpot) => void;
  onMapClick: (lat: number, lng: number) => void;
  hoveredLocationId: string | null;
  onMarkerHover: (id: string | null) => void;
  handleTouchStart: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  isMobile: boolean;
  useMobileMapFixer: boolean;
  showRadiusCircles: boolean;
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
  useMobileMapFixer,
  showRadiusCircles,
  isForecastMode = false,
  selectedForecastDay = 0
}) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear timeout on component unmount
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // When the map is ready
  const handleMapReady = () => {
    setIsMapReady(true);
    // Use window.setTimeout instead of setTimeout directly
    timeoutRef.current = window.setTimeout(() => {
      onMapReady();
    }, 300);
  };

  return (
    <MapContent
      center={center}
      zoom={zoom}
      userLocation={userLocation}
      locations={locations}
      isMapReady={isMapReady}
      onMapReady={handleMapReady}
      onLocationClick={onLocationClick}
      onMapClick={onMapClick}
      searchRadius={searchRadius}
      activeView={activeView}
      hoveredLocationId={hoveredLocationId}
      onMarkerHover={onMarkerHover}
      handleTouchStart={handleTouchStart}
      handleTouchEnd={handleTouchEnd}
      handleTouchMove={handleTouchMove}
      isMobile={isMobile}
      useMobileMapFixer={useMobileMapFixer}
      showRadiusCircles={showRadiusCircles}
      isForecastMode={isForecastMode}
      selectedForecastDay={selectedForecastDay}
    />
  );
};

export default LazyMapContainer;
