
import React, { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { LocationMarker, UserLocationMarker } from "./MarkerComponents";
import { configureLeaflet } from "@/components/location/map/MapMarkerUtils";
import { calculateDistance } from "@/utils/geoUtils";
import { currentSiqsStore } from "@/components/index/CalculatorSection";

// Configure Leaflet
configureLeaflet();

// Custom control component for map interaction
const MapController = ({
  mapCenter,
  initialZoom,
  onMapReady
}: {
  mapCenter: [number, number];
  initialZoom: number;
  onMapReady: () => void;
}) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      // Center map on initial load
      map.setView(mapCenter, initialZoom);
      onMapReady();
    }
  }, [map, mapCenter, initialZoom, onMapReady]);

  return null;
};

// Map Events handler for clicks and hover clear
const MapEventHandler = ({ 
  onMapClick, 
  clearHover 
}: { 
  onMapClick: (lat: number, lng: number) => void;
  clearHover: () => void;
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    const handleMouseDown = () => {
      clearHover();
    };
    
    const handleDragStart = () => {
      clearHover();
    };
    
    map.on('click', handleMapClick);
    map.on('mousedown', handleMouseDown);
    map.on('dragstart', handleDragStart);
    
    return () => {
      map.off('click', handleMapClick);
      map.off('mousedown', handleMouseDown);
      map.off('dragstart', handleDragStart);
    };
  }, [map, onMapClick, clearHover]);

  return null;
};

interface LazyMapContainerProps {
  userLocation: { latitude: number; longitude: number } | null;
  mapCenter: [number, number];
  initialZoom: number;
  locations: SharedAstroSpot[];
  hoveredLocationId: string | null;
  onLocationClick: (location: SharedAstroSpot) => void;
  onMapClick: (lat: number, lng: number) => void;
  onMapReady: () => void;
  clearHover: () => void;
  handleHover: (id: string | null) => void;
  searchRadius: number;
  showRadiusCircle: boolean;
  selectedLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  certifiedLocations: SharedAstroSpot[];
}

const LazyMapContainer: React.FC<LazyMapContainerProps> = ({
  userLocation,
  mapCenter,
  initialZoom,
  locations,
  hoveredLocationId,
  onLocationClick,
  onMapClick,
  onMapReady,
  clearHover,
  handleHover,
  searchRadius,
  showRadiusCircle,
  selectedLocation,
  activeView,
  certifiedLocations
}) => {
  const { t } = useLanguage();
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const currentSiqs = currentSiqsStore.getValue();

  // Handle map load complete
  const handleMapReady = useCallback(() => {
    setMapLoaded(true);
    if (onMapReady) onMapReady();
  }, [onMapReady]);

  // Filter locations by type (certified vs calculated)
  const getCertifiedStatus = useCallback((location: SharedAstroSpot): boolean => {
    return !!(location.isDarkSkyReserve || location.certification);
  }, []);
  
  // Check if location is on water (remove locations with "water", "ocean", "sea" in the name)
  const isLocationOnWater = useCallback((location: SharedAstroSpot): boolean => {
    const name = location.name?.toLowerCase() || '';
    const chineseName = location.chineseName?.toLowerCase() || '';
    const waterTerms = ['water', 'ocean', 'sea', 'lake', '水', '海', '湖', '洋'];
    
    return waterTerms.some(term => name.includes(term) || chineseName.includes(term));
  }, []);

  // Calculate locationId for each location
  const getLocationId = useCallback((location: SharedAstroSpot): string => {
    return location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
  }, []);

  // Create certified status map for quick lookups
  const certifiedStatusMap = new Map<string, boolean>();
  
  locations.forEach(location => {
    const locationId = getLocationId(location);
    certifiedStatusMap.set(locationId, getCertifiedStatus(location));
  });
  
  // Ensure certified locations are always displayed
  certifiedLocations.forEach(location => {
    const locationId = getLocationId(location);
    certifiedStatusMap.set(locationId, true);
  });

  // Determine if a location is within the search radius
  const isLocationInRadius = useCallback((location: SharedAstroSpot): boolean => {
    if (!selectedLocation) return true;
    
    // For certified locations or no radius specified, always show
    if (getCertifiedStatus(location) || !searchRadius) return true;
    
    // Calculate distance and check against radius
    const distance = calculateDistance(
      selectedLocation.latitude,
      selectedLocation.longitude,
      location.latitude,
      location.longitude
    );
    
    return distance <= searchRadius;
  }, [selectedLocation, searchRadius, getCertifiedStatus]);

  return (
    <MapContainer
      className={`photopoints-map-container ${mapLoaded ? 'map-loaded' : ''}`}
      center={mapCenter}
      zoom={initialZoom}
      style={{ height: "100%", width: "100%" }}
      ref={(map) => { if (map) mapRef.current = map.getContainer()._leaflet_id && map; }}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Display search radius circle */}
      {showRadiusCircle && selectedLocation && (
        <Circle
          center={[selectedLocation.latitude, selectedLocation.longitude]}
          radius={searchRadius * 1000} // Convert km to meters
          pathOptions={{
            color: '#8b5cf6',
            fillColor: '#8b5cf6',
            fillOpacity: 0.15, // Increased from 0.1 for better visibility
            weight: 2.5, // Increased from 2
            opacity: 0.7, // Increased from 0.6
            dashArray: '5, 5'
          }}
        />
      )}
      
      {/* Map location markers */}
      {locations
        .filter(location => 
          // Filter out water locations
          !isLocationOnWater(location) &&
          ((activeView === 'certified' && getCertifiedStatus(location)) || 
          (activeView === 'calculated' && !getCertifiedStatus(location)) ||
          // Always show both types when radius is specified
          (searchRadius > 0 && isLocationInRadius(location)))
        )
        .map(location => {
          const locationId = getLocationId(location);
          const isCertified = getCertifiedStatus(location);
          
          return (
            <LocationMarker
              key={locationId}
              location={location}
              onClick={onLocationClick}
              isHovered={hoveredLocationId === locationId}
              onHover={handleHover}
              locationId={locationId}
              isCertified={isCertified}
            />
          );
        })}
      
      {/* User location marker */}
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]}
          currentSiqs={currentSiqs}
        />
      )}
      
      {/* Map controllers */}
      <MapController
        mapCenter={mapCenter}
        initialZoom={initialZoom}
        onMapReady={handleMapReady}
      />
      
      <MapEventHandler
        onMapClick={onMapClick}
        clearHover={clearHover}
      />
      
      {/* Map overlay for subtle visual improvement */}
      <div className="map-overlay"></div>
    </MapContainer>
  );
};

export default LazyMapContainer;
