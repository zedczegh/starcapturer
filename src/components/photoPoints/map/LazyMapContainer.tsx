
import React, { useEffect, useCallback, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { createCustomMarker } from "@/components/location/map/MapMarkerUtils";
import SiqsScoreBadge from "../cards/SiqsScoreBadge";
import { getProgressColor } from "@/components/siqs/utils/progressColor";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

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
    if (userLocation) {
      if (firstRenderRef.current) {
        // Only set view once on first render to avoid constant recentering
        map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
        firstRenderRef.current = false;
      }
    }
    
  }, [map, userLocation]);

  return null;
};

// Create a SIQS-colored marker
const getSiqsMarker = (siqs: number | undefined) => {
  if (!siqs) return createCustomMarker('#777777'); // Gray for unknown SIQS
  
  const color = getProgressColor(siqs);
  return createCustomMarker(color);
};

// Location Marker component with popup handling
const LocationMarker = ({ 
  location, 
  onClick, 
  hoveredId, 
  setHoveredId 
}: { 
  location: SharedAstroSpot; 
  onClick: () => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}) => {
  const { t, language } = useLanguage();
  const locationId = `location-${location.id || `${location.latitude}-${location.longitude}`}`;
  const icon = getSiqsMarker(location.siqs);

  // Create refs to directly access the marker
  const markerRef = useRef<L.Marker | null>(null);

  // Manage hover state
  const handleMouseOver = useCallback(() => {
    setHoveredId(locationId);
  }, [locationId, setHoveredId]);

  const handleMouseOut = useCallback(() => {
    setHoveredId(null);
  }, [setHoveredId]);

  // Effect to open/close popup based on hover state
  useEffect(() => {
    if (!markerRef.current) return;
    
    const marker = markerRef.current;
    
    if (hoveredId === locationId) {
      marker.openPopup();
    } else {
      marker.closePopup();
    }
  }, [hoveredId, locationId]);

  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      eventHandlers={{
        click: onClick,
        mouseover: handleMouseOver,
        mouseout: handleMouseOut
      }}
      ref={markerRef}
    >
      <Popup 
        className="leaflet-popup-custom-compact"
        closeButton={false}
        closeOnClick={false}
        autoClose={false}
        autoPan={false}
      >
        <div className="p-1.5 max-w-[160px]">
          <div className="font-medium text-xs">
            {language === 'zh' && location.chineseName 
              ? location.chineseName 
              : location.name}
          </div>
          
          {/* SIQS Score Badge */}
          {location.siqs !== undefined && (
            <div className="mt-1 flex items-center gap-1">
              <SiqsScoreBadge score={location.siqs} />
              {location.distance && (
                <span className="text-xs text-muted-foreground">
                  {location.distance < 1 
                    ? `${(location.distance * 1000).toFixed(0)}m`
                    : `${location.distance.toFixed(1)}km`}
                </span>
              )}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

interface PhotoPointsMapContainerProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  onMapReady: () => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  zoom?: number;
}

const PhotoPointsMapContainer: React.FC<PhotoPointsMapContainerProps> = ({
  center,
  userLocation,
  locations,
  searchRadius,
  onMapReady,
  onLocationClick,
  onMapClick,
  zoom = 5
}) => {
  const { t } = useLanguage();
  const [mapElement, setMapElement] = useState<L.Map | null>(null);
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);

  // Create marker icons
  const userMarkerIcon = createCustomMarker('#9b87f5'); // Violet for user location (matching logo color)
  
  // Handle map click with default empty function if not provided
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onMapClick) {
      onMapClick(lat, lng);
    }
  }, [onMapClick]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      whenReady={(map) => {
        setMapElement(map.target);
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
      
      {/* Add MapEvents component to handle clicks if onMapClick is provided */}
      {onMapClick && <MapEvents onMapClick={handleMapClick} />}
      
      {/* Current user location marker */}
      {userLocation && (
        <Marker 
          position={[userLocation.latitude, userLocation.longitude]} 
          icon={userMarkerIcon}
        >
          <Popup className="leaflet-popup-custom">
            <div className="p-1">
              <strong>{t("Your Location", "您的位置")}</strong>
              <div className="text-xs mt-1">
                {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
              </div>
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* Search radius visualization as a faint circle */}
      {userLocation && searchRadius && (
        <Circle 
          center={[userLocation.latitude, userLocation.longitude]}
          radius={searchRadius * 1000} // Convert km to meters for circle radius
          pathOptions={{ 
            color: '#9b87f5', // Violet color matching logo
            fillColor: '#9b87f5',
            fillOpacity: 0.05,
            weight: 1,
            opacity: 0.3
          }}
        />
      )}
      
      {/* Location markers */}
      {locations.map((location) => {
        if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
          return null;
        }
        
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
            hoveredId={hoveredLocationId}
            setHoveredId={setHoveredLocationId}
          />
        );
      })}
    </MapContainer>
  );
};

export default PhotoPointsMapContainer;
