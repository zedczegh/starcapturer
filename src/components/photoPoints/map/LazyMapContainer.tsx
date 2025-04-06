
import React, { useEffect, useCallback, useState, useRef } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
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
const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
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
    
    // If user location exists, center on it
    if (userLocation && firstRenderRef.current) {
      // Only set view once on first render to avoid constant recentering
      map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
      firstRenderRef.current = false;
    }
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
  
  // Handle SIQS calculation results
  const handleSiqsCalculated = useCallback((siqs: number) => {
    setCurrentSiqs(siqs);
  }, []);

  // Filter out any invalid locations
  const validLocations = locations.filter(location => 
    location && typeof location.latitude === 'number' && typeof location.longitude === 'number'
  );

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      whenReady={(map) => {
        onMapReady();
      }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
      {onMapClick && <MapEvents onMapClick={onMapClick} />}
      
      {/* Current user location marker */}
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]}
          currentSiqs={currentSiqs}
        />
      )}
      
      {/* Search radius visualization as a faint circle */}
      {userLocation && searchRadius && searchRadius < 1000 && (
        <Circle 
          center={[userLocation.latitude, userLocation.longitude]}
          radius={searchRadius * 1000} // Convert km to meters for circle radius
          pathOptions={{ 
            color: isCertifiedView ? '#FFD700' : '#9b87f5',
            fillColor: isCertifiedView ? '#FFD700' : '#9b87f5',
            fillOpacity: 0.05,
            weight: 1,
            opacity: 0.3
          }}
        />
      )}
      
      {/* Location markers */}
      {validLocations.map((location) => {
        // Generate a unique ID for this location
        const locationId = `location-${location.id || `${location.latitude}-${location.longitude}`}`;
        
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
            isHovered={hoveredLocationId === locationId}
            onHover={onMarkerHover}
            locationId={locationId}
            isCertified={isCertifiedView}
          />
        );
      })}
    </MapContainer>
  );
};

export default PhotoPointsMapContainer;
