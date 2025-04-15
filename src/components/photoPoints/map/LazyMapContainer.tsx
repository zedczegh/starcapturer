
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import MapBase from './components/MapBase';
import MapMarkers from './components/MapMarkers';
import MapControllers from './components/MapControllers';

interface LazyMapContainerProps {
  center: [number, number];
  zoom: number;
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onMapReady: () => void;
  onLocationClick: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent<Element>, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent<Element>) => void;
  handleTouchMove?: (e: React.TouchEvent<Element>) => void;
  isMobile?: boolean;
  useMobileMapFixer?: boolean;
  showRadiusCircles?: boolean;
  preventAutoZoom?: boolean;
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
  isMobile = false,
  useMobileMapFixer = true,
  showRadiusCircles = false,
  preventAutoZoom = true
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const stableOnLocationClick = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);
  
  const stableOnMapClick = useCallback((lat: number, lng: number) => {
    if (onMapClick) {
      onMapClick(lat, lng);
      console.log("Map clicked, updating location to:", lat, lng);
    }
  }, [onMapClick]);
  
  const handleSiqsCalculated = useCallback((siqs: number) => {
    setCurrentSiqs(siqs);
  }, []);
  
  // Update SIQS when user location matches a location with SIQS
  useEffect(() => {
    if (userLocation && locations.length > 0) {
      const userLat = userLocation.latitude;
      const userLng = userLocation.longitude;
      
      const sameLocation = locations.find(loc => 
        Math.abs(loc.latitude - userLat) < 0.0001 && 
        Math.abs(loc.longitude - userLng) < 0.0001
      );
      
      if (sameLocation && sameLocation.siqs) {
        setCurrentSiqs(sameLocation.siqs);
      } else {
        setCurrentSiqs(null);
      }
    }
  }, [userLocation, locations]);
  
  const handleMapReadyInternal = useCallback(() => {
    setMapReady(true);
    if (onMapReady) {
      onMapReady();
    }
  }, [onMapReady]);

  return (
    <div ref={mapContainerRef} className="relative w-full h-full">
      <MapBase
        center={center}
        zoom={zoom}
        userLocation={userLocation}
        searchRadius={searchRadius}
        showRadiusCircles={showRadiusCircles}
        isMobile={isMobile}
        onMapReady={handleMapReadyInternal}
      >
        <MapControllers 
          userLocation={userLocation}
          activeView={activeView}
          searchRadius={searchRadius}
          useMobileMapFixer={useMobileMapFixer}
          isMobile={isMobile}
          onMapClick={stableOnMapClick}
          onSiqsCalculated={handleSiqsCalculated}
        />
        
        <MapMarkers
          userLocation={userLocation}
          locations={locations}
          activeView={activeView}
          hoveredLocationId={hoveredLocationId}
          onLocationClick={stableOnLocationClick}
          onMarkerHover={onMarkerHover}
          handleTouchStart={handleTouchStart}
          handleTouchEnd={handleTouchEnd}
          handleTouchMove={handleTouchMove}
          currentSiqs={currentSiqs}
        />
      </MapBase>
    </div>
  );
};

export default LazyMapContainer;
