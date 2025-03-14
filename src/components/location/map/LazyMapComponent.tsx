
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { validateCoordinates, formatCoordinates } from '@/utils/coordinates';
import * as LocationNameService from './LocationNameService';
import { useLanguage } from '@/contexts/LanguageContext';

// Fix for the default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

// Create custom marker icon
const createCustomMarker = () => {
  return L.divIcon({
    html: `
      <div class="marker-pin-container">
        <div class="marker-pin animate-pulse-subtle"></div>
        <div class="marker-shadow"></div>
      </div>
    `,
    className: 'custom-map-marker',
    iconSize: [30, 42],
    iconAnchor: [15, 42]
  });
};

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

// Map Events Handler component for handling clicks
const MapEventsHandler = ({ onMapClick, isInteractive }) => {
  const map = useMap();
  
  // Set up event listeners
  useEffect(() => {
    if (!isInteractive || !onMapClick) return;
    
    const handleMapClick = (e) => {
      if (isInteractive && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    };
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, isInteractive, onMapClick]);
  
  return null;
};

const LazyMapComponent = ({ 
  latitude, 
  longitude, 
  onLocationNameUpdate, 
  isInteractive = true,
  mapHeight = '400px',
  zoom = 12,
  showPopup = true,
  onMapReady = () => {},
  onMapClick = () => {}
}) => {
  // Validate coordinates to ensure they're within valid ranges
  const validCoordinates = validateCoordinates({ latitude, longitude });
  const center = [validCoordinates.latitude, validCoordinates.longitude];
  const { language } = useLanguage();
  
  // State for the location name display
  const [locationName, setLocationName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [markerPosition, setMarkerPosition] = useState(center);
  const [customIcon, setCustomIcon] = useState(null);
  
  // Create custom marker icon on component mount
  useEffect(() => {
    setCustomIcon(createCustomMarker());
  }, []);
  
  // Update marker position when center changes
  useEffect(() => {
    setMarkerPosition(center);
  }, [center]);
  
  // Handle map ready event
  const handleMapReady = useCallback(() => {
    setIsLoading(false);
    onMapReady();
    
    // Get location name if callback is provided
    if (onLocationNameUpdate) {
      const locationService = LocationNameService;
      locationService.getLocationNameForCoordinates(validCoordinates.latitude, validCoordinates.longitude, language, {
        setCachedData: (key, data) => {
          try {
            localStorage.setItem(key, JSON.stringify(data));
          } catch (e) {
            console.error("Error caching location data:", e);
          }
        },
        getCachedData: (key) => {
          try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
          } catch (e) {
            console.error("Error retrieving cached location data:", e);
            return null;
          }
        }
      })
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
  }, [validCoordinates.latitude, validCoordinates.longitude, language, onLocationNameUpdate, onMapReady]);
  
  // Handle map click from the MapEventsHandler
  const handleMapClick = useCallback((lat, lng) => {
    if (isInteractive) {
      setMarkerPosition([lat, lng]);
      onMapClick(lat, lng);
    }
  }, [isInteractive, onMapClick]);
  
  return (
    <div style={{ position: 'relative', height: mapHeight, width: '100%' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-cosmic-800/50 backdrop-blur-sm z-20 transition-all duration-300">
          <div className="flex flex-col items-center bg-cosmic-900/80 p-4 rounded-lg shadow-lg border border-primary/20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-3 text-primary-foreground text-sm font-medium">Loading map...</p>
          </div>
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
        
        <Marker 
          position={markerPosition}
          icon={customIcon || L.icon({
            iconUrl: '/marker-icon.png',
            iconRetinaUrl: '/marker-icon-2x.png',
            shadowUrl: '/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
          })}
        >
          {showPopup && (
            <Popup>
              <div className="text-slate-800">
                {locationName || formatCoordinates(validCoordinates.latitude, validCoordinates.longitude)}
              </div>
            </Popup>
          )}
        </Marker>
        
        <MapUpdater center={center} />
        <MapEventsHandler onMapClick={handleMapClick} isInteractive={isInteractive} />
      </MapContainer>
    </div>
  );
};

export default LazyMapComponent;
