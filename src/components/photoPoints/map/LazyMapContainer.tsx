
import React, { useEffect, useCallback, useState, useRef } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';  
import 'leaflet/dist/leaflet.css';
import './MarkerStyles.css'; // Import custom marker styles
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import MapEffectsController from './MapEffectsController';
import { UserLocationMarker, LocationMarker } from './MarkerComponents';
import { configureLeaflet } from "@/components/location/map/MapMarkerUtils";

// Configure Leaflet on load
configureLeaflet();

// Map Events component to handle click events and updates
const MapEvents = ({ 
  onMapClick, 
  onMapDragStart, 
  onMapDragEnd,
  onMapZoomEnd 
}: { 
  onMapClick: (lat: number, lng: number) => void;
  onMapDragStart?: () => void;
  onMapDragEnd?: () => void;
  onMapZoomEnd?: () => void;
}) => {
  const map = useMap();
  
  // Set up event listeners
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    const handleDragStart = () => {
      if (onMapDragStart) onMapDragStart();
    };
    
    const handleDragEnd = () => {
      if (onMapDragEnd) onMapDragEnd();
    };
    
    const handleZoomEnd = () => {
      if (onMapZoomEnd) onMapZoomEnd();
    };
    
    map.on('click', handleClick);
    map.on('dragstart', handleDragStart);
    map.on('dragend', handleDragEnd);
    map.on('zoomend', handleZoomEnd);
    
    // Store map reference in window for external access
    (window as any).leafletMap = map;
    
    return () => {
      // Clean up event listeners
      map.off('click', handleClick);
      map.off('dragstart', handleDragStart);
      map.off('dragend', handleDragEnd);
      map.off('zoomend', handleZoomEnd);
      // Clean up window reference
      delete (window as any).leafletMap;
    };
  }, [map, onMapClick, onMapDragStart, onMapDragEnd, onMapZoomEnd]);
  
  return null;
};

// Component to handle map events and interactions
const MapController = ({ 
  userLocation, 
  searchRadius
}: { 
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
}) => {
  const map = useMap();
  const firstRenderRef = useRef(true);
  
  useEffect(() => {
    if (!map) return;
    
    // Always enable all controls to allow dragging and interaction
    map.scrollWheelZoom.enable();
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    if (map.tap) map.tap.enable();
    
    // Explicitly check and log if dragging is enabled
    console.log("Map dragging enabled:", map.dragging.enabled());
    
    // Store map reference in window for external access
    (window as any).leafletMap = map;
    
    // If user location exists, center on it
    if (userLocation && firstRenderRef.current) {
      // Only set view once on first render to avoid constant recentering
      map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
      firstRenderRef.current = false;
    }

    // Improve performance by reduced rerenders on pan/zoom
    map._onResize = L.Util.throttle(map._onResize, 200, map);
    
    // Prevent horizontal wrapping of the world map (show only one copy)
    map.setMaxBounds([[-90, -180], [90, 180]]);
    
    return () => {
      // Clean up if needed
      delete (window as any).leafletMap;
    };
  }, [map, userLocation]);

  return null;
};

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
  const markersRef = useRef<Map<string, boolean>>(new Map());
  const [hideMarkerPopups, setHideMarkerPopups] = useState(false);
  
  // Optimize performance by reducing unnecessary marker updates
  const locationKeys = locations.map(loc => `${loc.latitude}-${loc.longitude}`).join(',');
  
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

  // Filter out any invalid locations
  const validLocations = locations.filter(location => 
    location && 
    typeof location.latitude === 'number' && 
    typeof location.longitude === 'number'
  );
  
  // Generate unique keys for markers to improve rendering performance
  const getMarkerKey = useCallback((location: SharedAstroSpot) => {
    return location.id || 
           `location-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}-${activeView}`;
  }, [activeView]);

  // Cache whether we've already rendered each marker
  useEffect(() => {
    // Reset marker cache when locations change significantly
    markersRef.current = new Map();
  }, [locationKeys]);
  
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

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      whenReady={(map) => {
        // Store map reference globally for external access
        (window as any).leafletMap = map.target;
        // Explicitly enable dragging
        map.target.dragging.enable();
        console.log("Map container ready, dragging enabled:", map.target.dragging.enabled());
        onMapReady();
      }}
      scrollWheelZoom={true}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        subdomains="abc"
        noWrap={true} // Prevent the map from repeating horizontally
      />
      
      {/* Controller for handling map events */}
      <MapController 
        userLocation={userLocation} 
        searchRadius={searchRadius}
      />
      
      {/* Effects controller for real-time SIQS and other effects */}
      <MapEffectsController
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
        onMapZoomEnd={() => onMarkerHover(null)}
      />
      
      {/* Current user location marker */}
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]}
          currentSiqs={currentSiqs}
        />
      )}
      
      {/* Search radius visualization as a more visible circle */}
      {userLocation && searchRadius && searchRadius < 1000 && (
        <Circle 
          center={[userLocation.latitude, userLocation.longitude]}
          radius={searchRadius * 1000} // Convert km to meters for circle radius
          pathOptions={{ 
            color: isCertifiedView ? '#FFD700' : '#9b87f5',
            fillColor: isCertifiedView ? '#FFD700' : '#9b87f5',
            fillOpacity: 0.08, // Increased opacity for more visibility
            weight: 1.5, // Thicker border
            opacity: 0.4, // More visible border
            className: 'location-radius-circle'
          }}
        />
      )}
      
      {/* Location markers */}
      {!hideMarkerPopups && locations.map((location) => {
        // Generate a unique ID for this location
        const locationId = location.id || 
           `location-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}-${activeView}`;
        
        // Handle the click event for this marker
        const handleClick = () => {
          if (onLocationClick) {
            onLocationClick(location);
          }
        };
        
        // Record that we're rendering this marker
        markersRef.current.set(locationId, true);
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={handleClick}
            isHovered={hoveredLocationId === locationId && !hideMarkerPopups}
            onHover={hideMarkerPopups ? () => {} : onMarkerHover}
            locationId={locationId}
            isCertified={isCertifiedView}
          />
        );
      })}
    </MapContainer>
  );
};

export default PhotoPointsMapContainer;
