
import React, { useState, useRef, useEffect } from 'react';
import LazyMapContainer from './LazyMapContainer';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useDebounce } from '@/hooks/useDebounce';

interface PhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onMapReady: () => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  mapCenter: [number, number];
  initialZoom?: number;
  isSearching?: boolean;
}

const PhotoPointsMap: React.FC<PhotoPointsMapProps> = ({
  userLocation,
  locations,
  searchRadius,
  activeView,
  onMapReady,
  onLocationClick,
  onMapClick,
  mapCenter,
  initialZoom = 5,
  isSearching = false
}) => {
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const debouncedHoverId = useDebounce(hoveredLocationId, 50);
  
  const handleMarkerHover = (id: string | null) => {
    setHoveredLocationId(id);
  };
  
  return (
    <div className="h-full w-full relative">
      <LazyMapContainer 
        center={mapCenter}
        userLocation={userLocation}
        locations={locations}
        searchRadius={searchRadius}
        activeView={activeView}
        onMapReady={onMapReady}
        onLocationClick={onLocationClick}
        onMapClick={onMapClick}
        zoom={initialZoom}
        hoveredLocationId={debouncedHoverId}
        onMarkerHover={handleMarkerHover}
        isSearching={isSearching}
      />
    </div>
  );
};

export default PhotoPointsMap;
