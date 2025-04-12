import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';  
import 'leaflet/dist/leaflet.css';
import './MarkerStyles.css'; // Import custom marker styles
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { WorldBoundsController, MapEvents } from './MapComponents';
import { UserLocationMarker, LocationMarker } from './MarkerComponents';
import { configureLeaflet } from "@/components/location/map/MapMarkerUtils";
import { MapController } from './MapController';
import MapEffectsComposer from './effects/MapEffectsComposer';
import RadarCircle from './RadarCircle';

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
  isSearching?: boolean;
}

// Use a function to efficiently chunk marker rendering
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

const MarkerGroup = React.memo(({ 
  locations, 
  onLocationClick,
  hoveredLocationId,
  onMarkerHover,
  isCertified,
  hideMarkerPopups
}: { 
  locations: SharedAstroSpot[], 
  onLocationClick?: (location: SharedAstroSpot) => void,
  hoveredLocationId: string | null,
  onMarkerHover: (id: string | null) => void,
  isCertified: boolean,
  hideMarkerPopups: boolean
}) => {
  return (
    <>
      {locations.map((location) => {
        if (!location || 
            typeof location.latitude !== 'number' || 
            typeof location.longitude !== 'number' ||
            isNaN(location.latitude) || 
            isNaN(location.longitude)) {
          return null;
        }
        
        const locationId = location.id || 
          `location-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        
        const handleClick = () => {
          if (onLocationClick) {
            onLocationClick(location);
          }
        };
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={handleClick}
            isHovered={hoveredLocationId === locationId && !hideMarkerPopups}
            onHover={hideMarkerPopups ? () => {} : onMarkerHover}
            locationId={locationId}
            isCertified={isCertified}
          />
        );
      })}
    </>
  );
});

// Separate component to update map center properly
const MapCenterHandler = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.length === 2 && 
        isFinite(center[0]) && isFinite(center[1]) &&
        Math.abs(center[0]) <= 90 && Math.abs(center[1]) <= 180) {
      map.setView(center, map.getZoom(), { animate: false });
    }
  }, [center, map]);
  
  return null;
};

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
  onMarkerHover,
  isSearching = false
}) => {
  const { t } = useLanguage();
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const isCertifiedView = activeView === 'certified';
  const [hideMarkerPopups, setHideMarkerPopups] = useState(false);
  const [mapRendered, setMapRendered] = useState(false);
  const [markerChunks, setMarkerChunks] = useState<SharedAstroSpot[][]>([]);
  const mapRef = useRef<L.Map | null>(null);
  
  const validCenter = useMemo(() => {
    return (center && center.length === 2 && 
            isFinite(center[0]) && isFinite(center[1]) &&
            Math.abs(center[0]) <= 90 && Math.abs(center[1]) <= 180) ? 
            center : [0, 0] as [number, number];
  }, [center]);
  
  const handleSiqsCalculated = useCallback((siqs: number) => {
    setCurrentSiqs(siqs);
  }, []);

  const handleMapDragStart = useCallback(() => {
    setHideMarkerPopups(true);
    onMarkerHover(null);
  }, [onMarkerHover]);
  
  const handleMapDragEnd = useCallback(() => {
    setTimeout(() => {
      setHideMarkerPopups(false);
    }, 100);
  }, []);
  
  const handleMapZoomEnd = useCallback(() => {
    onMarkerHover(null);
  }, [onMarkerHover]);

  const validLocations = useMemo(() => {
    return locations.filter(location => 
      location && 
      typeof location.latitude === 'number' && 
      typeof location.longitude === 'number' &&
      isFinite(location.latitude) &&
      isFinite(location.longitude) &&
      Math.abs(location.latitude) <= 90 &&
      Math.abs(location.longitude) <= 180
    );
  }, [locations]);
  
  useEffect(() => {
    if (validLocations.length > 0 && mapRendered) {
      const chunkSize = validLocations.length > 100 ? 30 : 50;
      setMarkerChunks(chunkArray(validLocations, chunkSize));
    }
  }, [validLocations, mapRendered]);
  
  const storeMapRef = useCallback((map: L.Map) => {
    mapRef.current = map;
    map.dragging.enable();
    console.log("Map container ready, dragging enabled:", map.dragging.enabled());
    setMapRendered(true);
    onMapReady();
    
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 100);
  }, [onMapReady]);
  
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setHideMarkerPopups(true);
    onMarkerHover(null);
    
    setTimeout(() => {
      setHideMarkerPopups(false);
    }, 100);
    
    if (onMapClick) {
      onMapClick(lat, lng);
    }
  }, [onMapClick, onMarkerHover]);

  const radarColor = isCertifiedView ? '#FFD700' : '#9b87f5';

  return (
    <MapContainer
      center={validCenter}
      zoom={zoom}
      className="h-full w-full"
      whenReady={({ target }) => {
        (window as any).leafletMap = target;
        storeMapRef(target);
      }}
      scrollWheelZoom={true}
      minZoom={2}
    >
      <MapCenterHandler center={validCenter} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        subdomains="abc"
      />
      
      <MapController 
        userLocation={userLocation} 
        searchRadius={searchRadius}
      />
      
      <MapEffectsComposer 
        userLocation={userLocation}
        activeView={activeView}
        searchRadius={searchRadius}
        onSiqsCalculated={handleSiqsCalculated}
      />
      
      <MapEvents 
        onMapClick={handleMapClick} 
        onMapDragStart={handleMapDragStart}
        onMapDragEnd={handleMapDragEnd}
        onMapZoomEnd={handleMapZoomEnd}
      />
      
      {userLocation && 
       typeof userLocation.latitude === 'number' &&
       typeof userLocation.longitude === 'number' && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]}
          currentSiqs={currentSiqs}
        />
      )}
      
      {userLocation && 
       searchRadius && 
       typeof userLocation.latitude === 'number' &&
       typeof userLocation.longitude === 'number' && (
        <RadarCircle
          center={[userLocation.latitude, userLocation.longitude]}
          radiusInKm={searchRadius}
          isSearching={isSearching}
          color={radarColor}
        />
      )}
      
      {userLocation && 
       searchRadius && 
       !isSearching &&
       typeof userLocation.latitude === 'number' &&
       typeof userLocation.longitude === 'number' && (
        <Circle 
          center={[userLocation.latitude, userLocation.longitude]}
          radius={searchRadius * 1000} // Convert km to meters for circle radius
          pathOptions={{ 
            color: isCertifiedView ? '#FFD700' : '#9b87f5',
            fillColor: isCertifiedView ? '#FFD700' : '#9b87f5',
            fillOpacity: 0.08,
            weight: 1.5,
            opacity: 0.4,
            className: 'location-radius-circle'
          }}
        />
      )}
      
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
