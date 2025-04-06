
import React, { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { createCustomMarker } from "@/components/location/map/MapMarkerUtils";
import SiqsScoreBadge from "../cards/SiqsScoreBadge";
import { formatSIQSScoreForDisplay } from "@/hooks/siqs/siqsCalculationUtils";
import L from "leaflet";

// Fix Leaflet icon issue in bundled environments
function fixLeafletIcons() {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

// Component to handle map events and interactions
const MapController = ({ 
  userLocation, 
  searchRadius,
  onMove,
}: { 
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  onMove?: (center: L.LatLng, zoom: number) => void;
}) => {
  const map = useMap();
  
  // Use correct zoom based on search radius
  useEffect(() => {
    if (!map) return;
    
    // Convert radius to zoom level
    let zoom = 10; // Default zoom
    if (searchRadius <= 200) zoom = 9;
    else if (searchRadius <= 500) zoom = 7;
    else if (searchRadius <= 1000) zoom = 6;
    else if (searchRadius <= 5000) zoom = 4;
    else zoom = 3;

    // Only change zoom if it's significantly different
    if (Math.abs(map.getZoom() - zoom) >= 1) {
      map.setZoom(zoom);
    }
    
    // Enable all controls and interactions if we have user location
    if (userLocation) {
      map.scrollWheelZoom.enable();
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      if (map.tap) map.tap.enable();
    }
  }, [map, searchRadius, userLocation]);

  // Handle map movement events
  useEffect(() => {
    if (!map || !onMove) return;

    const handleMove = () => {
      onMove(map.getCenter(), map.getZoom());
    };

    map.on('moveend', handleMove);
    return () => {
      map.off('moveend', handleMove);
    };
  }, [map, onMove]);

  return null;
};

interface LazyMapContainerProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  onMapReady: () => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
}

const LazyMapContainer: React.FC<LazyMapContainerProps> = ({
  center,
  userLocation,
  locations,
  searchRadius,
  onMapReady,
  onLocationClick,
}) => {
  const { t, language } = useLanguage();
  const mapRef = useRef(null);

  // Fix Leaflet icon issue
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  // Create marker icons
  const userMarkerIcon = createCustomMarker('#3b82f6'); // Blue for user location
  const locationMarkerIcon = createCustomMarker('#10b981'); // Green for certified locations
  const calculatedMarkerIcon = createCustomMarker('#f59e0b'); // Amber for calculated locations

  return (
    <MapContainer
      center={center}
      zoom={5}
      className="h-full w-full"
      whenReady={() => onMapReady()}
      ref={mapRef}
      attributionControl={true}
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
      
      {/* Search radius visualization as a circle */}
      {userLocation && searchRadius && (
        <Circle 
          center={[userLocation.latitude, userLocation.longitude]}
          radius={searchRadius * 1000} // Convert km to meters
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
        
        // Handle click event
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
            eventHandlers={onLocationClick ? { click: handleClick } : {}}
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

export default LazyMapContainer;
