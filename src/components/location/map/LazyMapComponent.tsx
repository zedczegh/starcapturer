
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { validateCoordinates, formatCoordinates } from '@/utils/coordinates';
import LocationNameService from './LocationNameService';
import { useLanguage } from '@/contexts/LanguageContext';

// Fix for the default marker icon in Leaflet
// This is needed because Leaflet's CSS assumes the images are in a different path
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

// Component to update map view when coordinates change
const MapUpdater = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
};

const LazyMapComponent = ({ 
  latitude, 
  longitude, 
  onLocationNameUpdate, 
  isInteractive = true,
  mapHeight = '400px',
  zoom = 12,
  showPopup = true
}) => {
  // Validate coordinates to ensure they're within valid ranges
  const validCoordinates = validateCoordinates({ latitude, longitude });
  const center = [validCoordinates.latitude, validCoordinates.longitude];
  const { language } = useLanguage();
  
  // State for the location name display
  const [locationName, setLocationName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Handle map ready event
  const handleMapReady = useCallback(() => {
    setIsLoading(false);
    
    // Get location name if callback is provided
    if (onLocationNameUpdate) {
      const locationService = new LocationNameService();
      locationService.getLocationName(validCoordinates.latitude, validCoordinates.longitude, language)
        .then(name => {
          setLocationName(name);
          onLocationNameUpdate(name);
        })
        .catch(error => {
          console.error("Error fetching location name:", error);
          const fallbackName = formatCoordinates(validCoordinates.latitude, validCoordinates.longitude);
          setLocationName(fallbackName);
          onLocationNameUpdate(fallbackName);
        });
    }
  }, [validCoordinates.latitude, validCoordinates.longitude, language, onLocationNameUpdate]);
  
  return (
    <div style={{ position: 'relative', height: mapHeight, width: '100%' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/20 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cosmic-400"></div>
        </div>
      )}
      
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        whenReady={handleMapReady}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          subdomains={['a', 'b', 'c']}
        />
        
        <Marker position={center}>
          {showPopup && (
            <Popup>
              <div className="text-slate-800">
                {locationName || formatCoordinates(validCoordinates.latitude, validCoordinates.longitude)}
              </div>
            </Popup>
          )}
        </Marker>
        
        <MapUpdater center={center} />
      </MapContainer>
    </div>
  );
};

export default LazyMapComponent;
