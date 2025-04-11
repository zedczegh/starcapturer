
import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';  
import 'leaflet/dist/leaflet.css';
import './MarkerStyles.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { MapEvents } from './MapComponents';
import { UserLocationMarker } from './MarkerComponents';
import { configureLeaflet } from "@/components/location/map/MapMarkerUtils";
import { MapController } from './MapController';
import MapEffectsComposer from './effects/MapEffectsComposer';
import { useMapMarkers } from '@/hooks/photoPoints/useMapMarkers';
import MarkerGroup from './markers/MarkerGroup';
import SearchRadiusCircle from './markers/SearchRadiusCircle';
import MapCenterHandler from './MapCenterHandler';

// Configure Leaflet on load
configureLeaflet();

interface PhotoPointsMapContainerProps {
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

const PhotoPointsMapContainer: React.FC<PhotoPointsMapContainerProps> = ({
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
  const { t } = useLanguage();
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const isCertifiedView = activeView === 'certified';
  const [mapRendered, setMapRendered] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  
  // Use the map markers hook
  const {
    validLocations,
    markerChunks,
    hideMarkerPopups,
    handleMapDragStart,
    handleMapDragEnd,
    setHideMarkerPopups
  } = useMapMarkers(locations, mapRendered);
  
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
  
  const handleMapZoomEnd = useCallback(() => {
    onMarkerHover(null);
  }, [onMarkerHover]);

  // Store map reference when ready
  const storeMapRef = useCallback((map: L.Map) => {
    mapRef.current = map;
    // Explicitly enable dragging
    map.dragging.enable();
    console.log("Map container ready, dragging enabled:", map.dragging.enabled());
    setMapRendered(true);
    onMapReady();
    
    // Fix for Leaflet error by invalidating size after a short delay
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 100);
  }, [onMapReady]);
  
  // Handle map click that closes popups
  const handleMapClick = useCallback((lat: number, lng: number) => {
    // Hide all popups
    setHideMarkerPopups(true);
    onMarkerHover(null);
    
    // After a brief delay, allow popups again
    setTimeout(() => {
      setHideMarkerPopups(false);
    }, 100);
    
    // Pass the click to the parent
    if (onMapClick) {
      onMapClick(lat, lng);
    }
  }, [onMapClick, onMarkerHover, setHideMarkerPopups]);

  return (
    <MapContainer
      center={validCenter}
      zoom={zoom}
      className="h-full w-full"
      whenReady={({ target }) => {
        // Store map reference globally for external access
        (window as any).leafletMap = target;
        storeMapRef(target);
      }}
      scrollWheelZoom={true}
    >
      {/* Add a MapCenterHandler to properly handle center changes */}
      <MapCenterHandler center={validCenter} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        subdomains="abc"
      />
      
      {/* Controller for handling map setup and controls */}
      <MapController 
        userLocation={userLocation} 
        searchRadius={searchRadius}
      />
      
      {/* Effects composer for all effects like bounds control and SIQS calculation */}
      <MapEffectsComposer 
        userLocation={userLocation}
        activeView={activeView}
        searchRadius={searchRadius}
        onSiqsCalculated={handleSiqsCalculated}
      />
      
      {/* Add MapEvents component to handle clicks if onMapClick is provided */}
      <MapEvents 
        onMapClick={handleMapClick} 
        onMapDragStart={handleMapDragStart}
        onMapDragEnd={handleMapDragEnd}
        onMapZoomEnd={handleMapZoomEnd}
      />
      
      {/* Current user location marker */}
      {userLocation && 
       typeof userLocation.latitude === 'number' &&
       typeof userLocation.longitude === 'number' && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]}
          currentSiqs={currentSiqs}
        />
      )}
      
      {/* Search radius visualization */}
      <SearchRadiusCircle 
        userLocation={userLocation}
        searchRadius={searchRadius}
        isCertifiedView={isCertifiedView}
      />
      
      {/* Location markers rendered in batches for better performance */}
      {!hideMarkerPopups && mapRendered && markerChunks.map((chunk, i) => (
        <MarkerGroup
          key={`marker-chunk-${i}`}
          locations={chunk}
          onLocationClick={onLocationClick}
          hoveredLocationId={hoveredLocationId}
          onMarkerHover={onMarkerHover}
          isCertified={isCertifiedView}
          hideMarkerPopups={hideMarkerPopups}
        />
      ))}
    </MapContainer>
  );
};

export default React.memo(PhotoPointsMapContainer);
