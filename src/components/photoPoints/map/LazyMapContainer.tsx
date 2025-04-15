
import React, { useCallback, useState, useMemo } from 'react';
import { Circle } from 'react-leaflet';
import L from 'leaflet';
import './MarkerStyles.css';
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { MapEvents } from './MapComponents';
import { UserLocationMarker } from './MarkerComponents';
import { MapController } from './MapController';
import MapEffectsComposer from './effects/MapEffectsComposer';
import { MapBase } from './components/MapBase';
import { LocationMarkers } from './components/LocationMarkers';

interface LazyMapContainerProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onMapReady: () => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  zoom?: number;
  hoveredLocationId: string | null;
  onMarkerHover: (id: string | null) => void;
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
  zoom = 5,
  hoveredLocationId,
  onMarkerHover
}) => {
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const isCertifiedView = activeView === 'certified';
  const [hideMarkerPopups, setHideMarkerPopups] = useState(false);
  const [mapRendered, setMapRendered] = useState(false);

  // Make sure center coordinates are valid
  const validCenter = useMemo(() => {
    return (center && center.length === 2 && 
            isFinite(center[0]) && isFinite(center[1]) &&
            Math.abs(center[0]) <= 90 && Math.abs(center[1]) <= 180) ? 
            center : [0, 0] as [number, number];
  }, [center]);

  // Handle SIQS calculation results
  const handleSiqsCalculated = useCallback((siqs: number) => {
    setCurrentSiqs(siqs);
  }, []);

  // Map interaction handlers
  const handleMapDragStart = useCallback(() => {
    setHideMarkerPopups(true);
    onMarkerHover(null);
  }, [onMarkerHover]);
  
  const handleMapDragEnd = useCallback(() => {
    setTimeout(() => setHideMarkerPopups(false), 100);
  }, []);

  // Map initialization handler
  const handleMapInit = useCallback((map: L.Map) => {
    map.dragging.enable();
    console.log("Map container ready, dragging enabled:", map.dragging.enabled());
    setMapRendered(true);
    onMapReady();
    
    setTimeout(() => map.invalidateSize(), 100);
  }, [onMapReady]);

  // Search radius visualization
  const renderSearchRadiusCircle = useMemo(() => {
    if (!userLocation || !searchRadius || searchRadius >= 1000) return null;
    
    return (
      <Circle 
        center={[userLocation.latitude, userLocation.longitude]}
        radius={searchRadius * 1000}
        pathOptions={{ 
          color: isCertifiedView ? '#FFD700' : '#9b87f5',
          fillColor: isCertifiedView ? '#FFD700' : '#9b87f5',
          fillOpacity: 0.08,
          weight: 1.5,
          opacity: 0.4,
          className: 'location-radius-circle'
        }}
      />
    );
  }, [userLocation, searchRadius, isCertifiedView]);

  return (
    <MapBase center={validCenter} zoom={zoom} onMapReady={handleMapInit}>
      <MapController userLocation={userLocation} searchRadius={searchRadius} />
      
      <MapEffectsComposer 
        userLocation={userLocation}
        activeView={activeView}
        searchRadius={searchRadius}
        onSiqsCalculated={handleSiqsCalculated}
      />
      
      <MapEvents 
        onMapClick={onMapClick} 
        onMapDragStart={handleMapDragStart}
        onMapDragEnd={handleMapDragEnd}
      />
      
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]}
          currentSiqs={currentSiqs}
        />
      )}
      
      {renderSearchRadiusCircle}
      
      {!hideMarkerPopups && mapRendered && (
        <LocationMarkers
          locations={locations}
          onLocationClick={onLocationClick}
          hoveredLocationId={hoveredLocationId}
          onMarkerHover={onMarkerHover}
          hideMarkerPopups={hideMarkerPopups}
          activeView={activeView}
          isCertifiedView={isCertifiedView}
        />
      )}
    </MapBase>
  );
};

export default React.memo(LazyMapContainer);
