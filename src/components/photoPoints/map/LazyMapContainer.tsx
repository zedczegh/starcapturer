
import React, { useEffect, useRef, lazy, Suspense } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';

// Create specialized marker icons
const createDarkSkyMarker = () => createCustomMarker('#3b50ff', {
  className: 'pulse-marker dark-sky-marker'
});

const createCalculatedMarker = () => createCustomMarker('#10b981', {
  className: 'pulse-marker calculated-marker'
});

const createUserMarker = () => createCustomMarker('#ff4040');

const createSelectedMarker = (type: string) => {
  const color = type === 'dark-sky' ? '#3b50ff' : '#10b981';
  return createCustomMarker(color, {
    className: 'selected-marker pulse-strong'
  });
};

interface MarkerConfig {
  position: [number, number];
  id: string;
  title: string;
  icon: 'dark-sky' | 'calculated' | 'user';
  isSelected?: boolean;
  onClick?: () => void;
  popup?: {
    title: string;
    description: string;
    content?: React.ReactNode;
  };
}

interface LazyMapContainerProps {
  center: [number, number];
  zoom: number;
  markers: MarkerConfig[];
  userLocation?: [number, number];
  searchRadius?: number;
  onMapReady?: () => void;
}

// This component updates the map when props change
const MapController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  
  return null;
};

const LazyMapContainer: React.FC<LazyMapContainerProps> = ({
  center,
  zoom,
  markers,
  userLocation,
  searchRadius,
  onMapReady
}) => {
  const { t } = useLanguage();
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (onMapReady) {
      onMapReady();
    }
  }, [onMapReady]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      whenReady={() => onMapReady?.()}
      zoomControl={false}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapController center={center} zoom={zoom} />
      
      {/* User location marker and search radius */}
      {userLocation && (
        <>
          <Marker 
            position={userLocation} 
            icon={createUserMarker()}
          >
            <Popup>
              <div className="p-2">
                <div className="font-medium text-sm">
                  {t("Your Location", "您的位置")}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
          
          {searchRadius && (
            <Circle
              center={userLocation}
              radius={searchRadius * 1000} // Convert to meters
              pathOptions={{ 
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.05,
                weight: 1,
                opacity: 0.3,
                dashArray: '5, 5'
              }}
            />
          )}
        </>
      )}
      
      {/* Location markers */}
      {markers.map(marker => {
        // Determine which marker icon to use
        let markerIcon;
        if (marker.isSelected) {
          markerIcon = createSelectedMarker(marker.icon);
        } else if (marker.icon === 'dark-sky') {
          markerIcon = createDarkSkyMarker();
        } else if (marker.icon === 'calculated') {
          markerIcon = createCalculatedMarker();
        } else {
          markerIcon = createUserMarker();
        }
        
        return (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={markerIcon}
            eventHandlers={{
              click: marker.onClick
            }}
          >
            {marker.popup && (
              <Popup>
                <div className="p-1">
                  <div className="font-medium text-sm">{marker.popup.title}</div>
                  <div className="text-xs text-blue-600 mt-0.5">{marker.popup.description}</div>
                  {marker.popup.content}
                </div>
              </Popup>
            )}
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default LazyMapContainer;
