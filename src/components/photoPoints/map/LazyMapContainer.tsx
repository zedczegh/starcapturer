
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
import { isWaterLocation, isValidAstronomyLocation } from '@/utils/locationValidator';
import MobileMapFixer from './MobileMapFixer'; // Import the new component

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
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  isMobile?: boolean;
  useMobileMapFixer?: boolean;
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
  hideMarkerPopups,
  activeView,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove
}: { 
  locations: SharedAstroSpot[], 
  onLocationClick?: (location: SharedAstroSpot) => void,
  hoveredLocationId: string | null,
  onMarkerHover: (id: string | null) => void,
  isCertified: boolean,
  hideMarkerPopups: boolean,
  activeView: 'certified' | 'calculated',
  handleTouchStart?: (e: React.TouchEvent, id: string) => void,
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void,
  handleTouchMove?: (e: React.TouchEvent) => void
}) => {
  // Pre-filter locations to avoid rendering water spots
  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      // Skip invalid locations
      if (!location || 
          typeof location.latitude !== 'number' || 
          typeof location.longitude !== 'number' ||
          isNaN(location.latitude) || 
          isNaN(location.longitude)) {
        return false;
      }
      
      // Individual location certification status
      const locationIsCertified = location.isDarkSkyReserve === true || 
        (location.certification && location.certification !== '');
      
      // Skip non-certified locations in certified view
      if (activeView === 'certified' && !locationIsCertified) {
        return false;
      }
      
      // Always keep certified locations
      if (locationIsCertified) {
        return true;
      }
      
      // Aggressive water location filtering for calculated locations
      if (isWaterLocation(location.latitude, location.longitude, false)) {
        return false;
      }
      
      // Additional validation
      if (!isValidAstronomyLocation(location.latitude, location.longitude, location.name)) {
        return false;
      }
      
      return true;
    });
  }, [locations, activeView]);
  
  return (
    <>
      {filteredLocations.map((location) => {
        // Generate a unique ID for this location
        const locationId = location.id || 
          `location-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        
        // Individual location certification status
        const locationIsCertified = location.isDarkSkyReserve === true || 
          (location.certification && location.certification !== '');
        
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
            isCertified={locationIsCertified}
            activeView={activeView}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
            handleTouchMove={handleTouchMove}
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
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  isMobile = false,
  useMobileMapFixer = false
}) => {
  const { t } = useLanguage();
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const isCertifiedView = activeView === 'certified';
  const [hideMarkerPopups, setHideMarkerPopups] = useState(false);
  const [mapRendered, setMapRendered] = useState(false);
  const [markerChunks, setMarkerChunks] = useState<SharedAstroSpot[][]>([]);
  const mapRef = useRef<L.Map | null>(null);
  
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
    }, 100);
  }, []);
  
  const handleMapZoomEnd = useCallback(() => {
    onMarkerHover(null);
    
    // On mobile, fix marker positions after zoom
    if (isMobile && mapRef.current) {
      const markerPane = mapRef.current.getPanes().markerPane;
      if (markerPane) {
        // Force hardware acceleration to fix positioning
        markerPane.style.transform = 'translate3d(0,0,0)';
      }
    }
  }, [onMarkerHover, isMobile]);

  // Filter out any invalid locations
  const validLocations = useMemo(() => {
    return locations.filter(location => {
      // Basic validation
      if (!location || 
          typeof location.latitude !== 'number' || 
          typeof location.longitude !== 'number' ||
          isNaN(location.latitude) || 
          isNaN(location.longitude) ||
          Math.abs(location.latitude) > 90 ||
          Math.abs(location.longitude) > 180) {
        return false;
      }
      
      // Skip water locations for non-certified spots
      const isCertified = location.isDarkSkyReserve === true || 
        (location.certification && location.certification !== '');
      
      if (!isCertified) {
        // Apply strict water filtering
        if (isWaterLocation(location.latitude, location.longitude, false)) {
          return false;
        }
        
        // Additional validation
        if (!isValidAstronomyLocation(location.latitude, location.longitude, location.name)) {
          return false;
        }
      }
      
      return true;
    });
  }, [locations]);
  
  // Chunk locations for better rendering performance
  useEffect(() => {
    if (validLocations.length > 0 && mapRendered) {
      // Get optimal chunk size based on location count and device type
      const chunkSize = isMobile ? 
        (validLocations.length > 100 ? 20 : 30) : // Smaller chunks on mobile
        (validLocations.length > 100 ? 30 : 50);  // Larger chunks on desktop
      
      setMarkerChunks(chunkArray(validLocations, chunkSize));
    }
  }, [validLocations, mapRendered, isMobile]);
  
  // Store map reference when ready
  const storeMapRef = useCallback((map: L.Map) => {
    mapRef.current = map;
    // Explicitly enable dragging
    map.dragging.enable();
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

  // Configure map options with mobile optimizations
  const mapOptions: L.MapOptions = useMemo(() => {
    return {
      center: validCenter,
      zoom: zoom,
      scrollWheelZoom: true,
      minZoom: 2,
      bounceAtZoomLimits: !isMobile, // Disable bounce on mobile
      // Apply mobile-specific options
      ...(isMobile ? {
        // Reduce animations on mobile to improve performance
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        // Better touch handling
        tap: true,
        tapTolerance: 15,
        touchZoom: 'center',
        inertia: true,
        inertiaDeceleration: 2500,
        inertiaMaxSpeed: 1800,
      } : {})
    };
  }, [validCenter, zoom, isMobile]);

  return (
    <MapContainer
      {...mapOptions}
      className="h-full w-full"
      whenReady={({ target }) => {
        // Store map reference globally for external access
        (window as any).leafletMap = target;
        storeMapRef(target);
      }}
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
      
      {/* Add Mobile Map Fixer for better mobile experience */}
      {isMobile && useMobileMapFixer && <MobileMapFixer />}
      
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
          activeView={activeView}
          handleTouchStart={handleTouchStart}
          handleTouchEnd={handleTouchEnd}
          handleTouchMove={handleTouchMove}
        />
      ))}
    </MapContainer>
  );
};

export default React.memo(PhotoPointsMapContainer);
