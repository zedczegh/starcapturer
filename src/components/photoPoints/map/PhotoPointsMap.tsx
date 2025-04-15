
// For this large file, we'll just fix the TypeScript error without changing functionality
// Update the specific part of the file that's causing the error
import React, { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useMapEvents as useLeafletMapEvents } from 'react-leaflet'; // Manually implement if not available
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import useDebounce from '@/hooks/useDebounce';
import { useMapCenter } from '@/hooks/useMapCenter';
import { usePhotoPoints } from '@/hooks/usePhotoPoints';
import { usePhotoPointsMap } from '@/hooks/photoPoints/usePhotoPointsMap';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { isValidAstronomyLocation } from '@/utils/locationValidator';
import { getLocationMarker, getCertificationColor } from '@/components/photoPoints/map/MarkerUtils';
import { addLocationToStore } from '@/services/calculatedLocationsService';
import MapTooltip from '@/components/photoPoints/map/MapTooltip';
import MapLocationsLayer from '@/components/photoPoints/map/MapLocationsLayer';
import CenteringPinpointButton from '@/components/photoPoints/map/CenteringPinpointButton';
import { toast } from 'sonner'; // Add missing import for toast

// Leaflet marker fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow
});

L.Marker.prototype.options.icon = DefaultIcon;

// Add useMapEvents if it doesn't exist in react-leaflet
const useMapEvents = useLeafletMapEvents || ((events) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const handlers: Record<string, (e: any) => void> = {};
    
    // Add event handlers
    Object.entries(events).forEach(([event, handler]) => {
      handlers[event] = handler;
      map.on(event, handler);
    });
    
    // Clean up
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        map.off(event, handler);
      });
    };
  }, [map, events]);
  
  return map;
});

interface PhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onLocationUpdate: (location: SharedAstroSpot) => void; // Modified to accept SharedAstroSpot
}

const PhotoPointsMap: React.FC<PhotoPointsMapProps> = ({
  userLocation,
  searchRadius,
  activeView,
  onLocationUpdate
}) => {
  const { t } = useLanguage();
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    userLocation ? [userLocation.latitude, userLocation.longitude] : [35.8617, 104.1954]
  );
  const [mapZoom, setMapZoom] = useState<number>(4);
  const [selectedMapLocation, setSelectedMapLocation] = useState<SharedAstroSpot | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [debouncedMapCenter, setDebouncedMapCenter] = useState(mapCenter);
  const debouncedRadius = useDebounce(searchRadius, 500);
  
  // Use custom hook for map logic
  const {
    handleMapReady,
    handleLocationClick,
    validLocations,
    initialZoom,
    certifiedLocationsLoaded,
    certifiedLocationsLoading,
    loadingProgress,
    allCertifiedLocationsCount
  } = usePhotoPointsMap({
    userLocation,
    locations: [], // Pass empty array here, as locations are handled internally
    searchRadius,
    activeView
  });
  
  // Update map center when user location changes
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation]);
  
  // Update map center when debounced map center changes
  useEffect(() => {
    setDebouncedMapCenter(mapCenter);
  }, [mapCenter]);
  
  // Update map zoom when debounced radius changes
  useEffect(() => {
    if (mapInstance) {
      const newZoom = calculateZoomLevel(debouncedRadius);
      setMapZoom(newZoom);
      mapInstance.setZoom(newZoom);
    }
  }, [debouncedRadius, mapInstance]);
  
  // Function to calculate zoom level based on radius
  const calculateZoomLevel = (radius: number): number => {
    if (radius <= 100) return 9;
    if (radius <= 300) return 7;
    if (radius <= 500) return 6;
    return 4;
  };
  
  // Handle map click to update location
  const handleMapClick = useCallback((lat: number, lng: number) => {
    const newLocation: SharedAstroSpot = {
      id: `map-click-${Date.now()}`,
      name: t("New Location", "新位置"),
      latitude: lat,
      longitude: lng,
      bortleScale: 4,
      timestamp: new Date().toISOString()
    };
    
    // Update the location using the provided callback
    onLocationUpdate(newLocation);
  }, [t, onLocationUpdate]);
  
  // Map component to handle events
  const MapEventsHandler = () => {
    useMapEvents({
      click: (e) => {
        handleMapClick(e.latlng.lat, e.latlng.lng);
      },
      moveend: () => {
        if (mapInstance) {
          const center = mapInstance.getCenter();
          setMapCenter([center.lat, center.lng]);
        }
      },
      zoomend: () => {
        if (mapInstance) {
          setMapZoom(mapInstance.getZoom());
        }
      }
    });
    return null;
  };
  
  // Function to handle getting the user's current location
  const handleGetLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          handleMapClick(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error(t("Could not get current location", "无法获取当前位置"));
        }
      );
    } else {
      toast.error(t("Geolocation is not supported by this browser", "此浏览器不支持地理位置"));
    }
  }, [t, handleMapClick]);
  
  return (
    <div className="relative w-full h-full">
      <MapContainer
        className="w-full h-full z-0"
        center={mapCenter}
        zoom={initialZoom}
        scrollWheelZoom={true}
        style={{ height: '600px', width: '100%' }}
        whenCreated={(map) => {
          setMapInstance(map);
          handleMapReady();
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEventsHandler />
        
        {userLocation && (
          <Marker position={[userLocation.latitude, userLocation.longitude]}>
            <Popup>{t("Your Location", "你的位置")}</Popup>
          </Marker>
        )}
        
        <MapLocationsLayer
          locations={validLocations}
        />
        
        <CenteringPinpointButton 
          onGetLocation={handleGetLocation}
          userLocation={userLocation}
        />
      </MapContainer>
    </div>
  );
};

export default PhotoPointsMap;
