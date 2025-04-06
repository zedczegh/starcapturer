
import React, { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { createCustomMarker } from "@/components/location/map/MapMarkerUtils";
import SiqsScoreBadge from "../cards/SiqsScoreBadge";
import { Circle } from 'react-leaflet';

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
      map.setView([userLocation.latitude, userLocation.longitude], map.getZoom());
    }
    
  }, [map, userLocation]);

  return null;
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
  const { t, language } = useLanguage();

  // Create marker icons
  const userMarkerIcon = createCustomMarker('#3b82f6'); // Blue for user location
  const locationMarkerIcon = createCustomMarker('#10b981'); // Green for certified locations
  const calculatedMarkerIcon = createCustomMarker('#f59e0b'); // Amber for calculated locations
  
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
      whenReady={() => onMapReady()}
      scrollWheelZoom={true}
      zoomControl={true}
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
          <Popup>
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
            color: '#3b82f6',
            fillColor: '#3b82f6',
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
        
        // Determine icon based on location type
        const icon = location.isDarkSkyReserve || location.certification 
          ? locationMarkerIcon 
          : calculatedMarkerIcon;
        
        // Handle the click event for this marker
        const handleClick = () => {
          if (onLocationClick) {
            onLocationClick(location);
          }
        };
        
        return (
          <Marker
            key={`location-${location.id || `${location.latitude}-${location.longitude}`}`}
            position={[location.latitude, location.longitude]}
            icon={icon}
            onClick={handleClick}
          >
            <Popup>
              <div className="p-1 max-w-[200px]">
                <div className="font-medium text-base">
                  {language === 'zh' && location.chineseName 
                    ? location.chineseName 
                    : location.name}
                </div>
                
                {/* SIQS Score Badge */}
                {location.siqs !== undefined && (
                  <div className="mt-2 flex items-center">
                    <SiqsScoreBadge score={location.siqs} />
                    {location.distance && (
                      <span className="text-xs ml-2 text-muted-foreground">
                        {location.distance < 1 
                          ? `${(location.distance * 1000).toFixed(0)}m`
                          : `${location.distance.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                )}
                
                {(location.isDarkSkyReserve || location.certification) && (
                  <div className="mt-1 text-xs font-medium text-emerald-600">
                    {location.isDarkSkyReserve ? t("Dark Sky Reserve", "暗夜保护区") : location.certification}
                  </div>
                )}
                
                {/* Description or coordinates */}
                <div className="mt-1 text-xs text-muted-foreground">
                  {location.description || `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default PhotoPointsMapContainer;
