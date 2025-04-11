
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

// Use a function to efficiently chunk marker rendering
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Enhanced marker group with better performance
const MarkerGroup = React.memo(({ 
  locations, 
  onLocationClick,
  hoveredLocationId,
  onMarkerHover,
  isCertified,
  hideMarkerPopups,
  bounds
}: { 
  locations: SharedAstroSpot[], 
  onLocationClick?: (location: SharedAstroSpot) => void,
  hoveredLocationId: string | null,
  onMarkerHover: (id: string | null) => void,
  isCertified: boolean,
  hideMarkerPopups: boolean,
  bounds: L.LatLngBounds | null
}) => {
  // Filter locations to only include those potentially within or near the current viewport
  // This significantly improves performance with large datasets
  const visibleLocations = useMemo(() => {
    if (!bounds) return locations;
    
    // Expand bounds by 20% to ensure markers near edges are included
    const expandedBounds = bounds.pad(0.2);
    
    return locations.filter(location => {
      if (!location || 
          typeof location.latitude !== 'number' || 
          typeof location.longitude !== 'number' ||
          isNaN(location.latitude) || 
          isNaN(location.longitude)) {
        return false;
      }
      
      // Always include certified locations for better visibility
      if (isCertified && (location.isDarkSkyReserve || location.certification)) {
        return true;
      }
      
      // For other locations, check if they're within expanded viewport bounds
      return expandedBounds.contains(L.latLng(location.latitude, location.longitude));
    });
  }, [locations, bounds, isCertified]);

  return (
    <>
      {visibleLocations.map((location) => {
        // Only render markers with valid coordinates
        if (!location || 
            typeof location.latitude !== 'number' || 
            typeof location.longitude !== 'number' ||
            isNaN(location.latitude) || 
            isNaN(location.longitude)) {
          return null;
        }
        
        // Generate a unique ID for this location
        const locationId = location.id || 
          `location-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        
        // Handle the click event for this marker
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

// Component to track current map bounds
const BoundsTracker = ({ 
  onBoundsChange 
}: { 
  onBoundsChange: (bounds: L.LatLngBounds) => void 
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    // Initial bounds
    onBoundsChange(map.getBounds());
    
    // Track bounds changes
    const handleMoveEnd = () => {
      onBoundsChange(map.getBounds());
    };
    
    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleMoveEnd);
    
    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleMoveEnd);
    };
  }, [map, onBoundsChange]);
  
  return null;
};

// Separate component to update map center properly
const MapCenterHandler = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    // Only center map if coordinates are valid
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
  onMarkerHover
}) => {
  const { t } = useLanguage();
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const isCertifiedView = activeView === 'certified';
  const [hideMarkerPopups, setHideMarkerPopups] = useState(false);
  const [mapRendered, setMapRendered] = useState(false);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [markerChunks, setMarkerChunks] = useState<SharedAstroSpot[][]>([]);
  const mapRef = useRef<L.Map | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  
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

  // Handle map interaction to hide popups while interacting
  const handleMapDragStart = useCallback(() => {
    setHideMarkerPopups(true);
    onMarkerHover(null);
  }, [onMarkerHover]);
  
  const handleMapDragEnd = useCallback(() => {
    // Small delay to prevent immediate popup reappearance
    setTimeout(() => {
      setHideMarkerPopups(false);
    }, 200);
  }, []);
  
  const handleMapZoomStart = useCallback(() => {
    setIsZooming(true);
    setHideMarkerPopups(true);
    onMarkerHover(null);
  }, [onMarkerHover]);
  
  const handleMapZoomEnd = useCallback(() => {
    setTimeout(() => {
      setIsZooming(false);
      setHideMarkerPopups(false);
    }, 300);
  }, []);
  
  // Update map bounds when they change
  const handleBoundsChange = useCallback((bounds: L.LatLngBounds) => {
    setMapBounds(bounds);
  }, []);

  // Filter out any invalid locations
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
  
  // Chunk locations for better rendering performance
  useEffect(() => {
    if (validLocations.length > 0 && mapRendered) {
      // Get optimal chunk size based on location count
      const chunkSize = validLocations.length > 100 ? 30 : 50;
      setMarkerChunks(chunkArray(validLocations, chunkSize));
    }
  }, [validLocations, mapRendered]);
  
  // Store map reference when ready
  const storeMapRef = useCallback((map: L.Map) => {
    mapRef.current = map;
    // Explicitly enable dragging
    map.dragging.enable();
    console.log("Map container ready, dragging enabled:", map.dragging.enabled());
    setMapRendered(true);
    onMapReady();
    
    // Fix for Leaflet error by invalidating size
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
  }, [onMapClick, onMarkerHover]);

  // Optimization: render circle conditionally
  const renderSearchRadiusCircle = useMemo(() => {
    if (userLocation && 
        searchRadius && 
        searchRadius < 1000 &&
        typeof userLocation.latitude === 'number' &&
        typeof userLocation.longitude === 'number' &&
        isFinite(userLocation.latitude) &&
        isFinite(userLocation.longitude)) {
      
      return (
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
      );
    }
    return null;
  }, [userLocation, searchRadius, isCertifiedView]);

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
      maxBounds={[[-85, -180], [85, 180]]} // Prevent panning outside world bounds
      minZoom={2} // Prevent zooming out too far which can cause rendering issues
    >
      {/* Add a MapCenterHandler to properly handle center changes */}
      <MapCenterHandler center={validCenter} />
      
      {/* Track map bounds for better marker filtering */}
      <BoundsTracker onBoundsChange={handleBoundsChange} />
      
      {/* Base map layer */}
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
      
      {/* Add world bounds controller to prevent navigation issues */}
      <WorldBoundsController />
      
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
        onMapZoomStart={handleMapZoomStart}
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
      {renderSearchRadiusCircle}
      
      {/* Location markers rendered with viewport filtering for better performance */}
      {mapRendered && !isZooming && (
        <MarkerGroup
          locations={validLocations}
          onLocationClick={onLocationClick}
          hoveredLocationId={hoveredLocationId}
          onMarkerHover={onMarkerHover}
          isCertified={isCertifiedView}
          hideMarkerPopups={hideMarkerPopups}
          bounds={mapBounds}
        />
      )}
    </MapContainer>
  );
};

export default React.memo(PhotoPointsMapContainer);
