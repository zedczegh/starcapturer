
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Circle, Popup } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { createLightPollutionMarker } from './MapMarkerUtils';
import 'leaflet/dist/leaflet.css';

// Reset the Leaflet icon paths
import { Icon, DivIcon, Marker as LeafletMarker, map } from 'leaflet';
import { createRestaurantMarker, createUserMarker } from '@/components/location/map/MapMarkerUtils';

// Fix Leaflet marker icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface LazyMapContainerProps {
  center: [number, number];
  zoom: number;
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onMapReady?: () => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
}

// Component to handle map effects after it's ready
const MapEffects = ({ onMapReady }: { onMapReady?: () => void }) => {
  const map = useMap();
  
  useEffect(() => {
    // Fix for initial render issues - wait a moment before invalidating size
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
      if (onMapReady) onMapReady();
    }, 100);
    
    // Also fix map on window resize
    const handleResize = () => {
      map.invalidateSize();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [map, onMapReady]);
  
  return null;
};

const LazyMapContainer: React.FC<LazyMapContainerProps> = ({
  center,
  zoom,
  userLocation,
  locations,
  searchRadius,
  activeView,
  onMapReady,
  onLocationClick,
  onMapClick,
  hoveredLocationId,
  onMarkerHover
}) => {
  const { language, t } = useLanguage();
  const mapRef = useRef<any>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  
  // Handle click on the map
  const handleMapClick = (e: any) => {
    if (onMapClick) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  };
  
  // Only render map when container is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!isMapInitialized) {
    return <div className="w-full h-full bg-cosmic-900/50"></div>;
  }
  
  return (
    <MapContainer
      key={`map-${activeView}-${searchRadius}-${center[0].toFixed(4)}-${center[1].toFixed(4)}`}
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', background: 'rgba(13, 14, 18, 0.8)' }}
      zoomControl={false}
      attributionControl={false}
      onClick={handleMapClick}
      whenReady={() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      
      <MapEffects onMapReady={onMapReady} />
      
      {/* User location marker */}
      {userLocation && (
        <Marker 
          position={[userLocation.latitude, userLocation.longitude]}
          icon={createUserMarker()}
        >
          <Popup>
            {t("Your location", "您的位置")}
          </Popup>
        </Marker>
      )}
      
      {/* Search radius circle */}
      {userLocation && searchRadius > 0 && (
        <Circle
          center={[userLocation.latitude, userLocation.longitude]}
          radius={searchRadius * 1000} // Convert km to meters
          pathOptions={{
            color: '#4f46e5',
            fillColor: '#4f46e5',
            fillOpacity: 0.1,
            weight: 1
          }}
        />
      )}
      
      {/* Markers for locations */}
      {locations.map((loc) => {
        if (!loc.latitude || !loc.longitude) return null;
        
        // Calculate marker size based on zoom level and certification
        const isCertified = loc.isDarkSkyReserve || loc.certification;
        const isHovered = hoveredLocationId === loc.id;
        const markerSize = isCertified ? 32 : 20;
        
        return (
          <Marker
            key={loc.id || `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`}
            position={[loc.latitude, loc.longitude]}
            icon={createLightPollutionMarker(
              loc.bortleScale || 4, 
              loc.siqs || 0, 
              isCertified, 
              isHovered,
              markerSize
            )}
            eventHandlers={{
              click: () => onLocationClick && onLocationClick(loc),
              mouseover: () => onMarkerHover && loc.id && onMarkerHover(loc.id),
              mouseout: () => onMarkerHover && onMarkerHover(null)
            }}
          >
            <Popup>
              <div className="text-center font-medium">
                {loc.name || (loc.isDarkSkyReserve ? t("Dark Sky Reserve", "暗夜保护区") : t("Astronomy location", "天文位置"))}
              </div>
              <div className="text-xs mt-1">
                SIQS: {loc.siqs?.toFixed(1) || 'N/A'}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default React.memo(LazyMapContainer);
