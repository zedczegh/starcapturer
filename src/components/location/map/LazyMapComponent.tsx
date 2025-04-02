
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from '@/contexts/LanguageContext';

// Fix Leaflet icon issue
// This is necessary because Leaflet's default icon paths are different in a bundled environment
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface LazyMapComponentProps {
  position: [number, number];
  locationName: string;
  editable?: boolean;
  onMapReady: () => void;
  onMapClick: (lat: number, lng: number) => void;
  showInfoPanel?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
}

const LazyMapComponent: React.FC<LazyMapComponentProps> = ({
  position,
  locationName,
  editable = false,
  onMapReady,
  onMapClick,
  showInfoPanel = false,
  isDarkSkyReserve = false,
  certification = ''
}) => {
  const { t } = useLanguage();
  
  // Call the onMapReady callback when the component mounts
  React.useEffect(() => {
    onMapReady();
  }, [onMapReady]);

  // Handle map click events
  const handleMapClick = React.useCallback((e: L.LeafletMouseEvent) => {
    if (editable) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  }, [editable, onMapClick]);

  return (
    <MapContainer
      center={position}
      zoom={5}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      whenReady={() => onMapReady()}
      onClick={handleMapClick}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          <div className="p-1">
            <strong>{locationName || t("Selected Location", "所选位置")}</strong>
            <div className="text-xs mt-1">
              {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </div>
            {isDarkSkyReserve && (
              <div className="mt-1 text-xs font-semibold text-blue-600">
                {t("Dark Sky Reserve", "暗夜保护区")}
              </div>
            )}
            {certification && (
              <div className="mt-1 text-xs font-semibold text-green-600">
                {certification}
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default LazyMapComponent;
