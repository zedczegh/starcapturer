
import React, { useCallback } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import { LocationMarker, UserLocationMarker } from '../MarkerComponents';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { currentSiqsStore } from '@/components/index/CalculatorSection';
import MapEffectsComposer from '../effects/MapEffectsComposer';
import SiqsEffectsController from '../effects/SiqsEffectsController';

interface MapContentProps {
  center: [number, number];
  zoom: number;
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onMapReady: () => void;
  onLocationClick: (location: SharedAstroSpot) => void;
  onMapClick: (lat: number, lng: number) => void;
  hoveredLocationId: string | null;
  onMarkerHover: (id: string | null) => void;
}

const MapContent: React.FC<MapContentProps> = ({
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
  const handleMapClick = useCallback((e: any) => {
    if (onMapClick) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  }, [onMapClick]);

  // Filter locations based on activeView
  const displayLocations = locations.filter(loc => {
    // In certified view, only show certified locations
    if (activeView === 'certified') {
      return Boolean(loc.isDarkSkyReserve || loc.certification);
    }
    // In calculated view, show all locations
    return true;
  });
  
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      whenReady={() => onMapReady()}
      onClick={handleMapClick}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Map effects and styling */}
      <MapEffectsComposer
        userLocation={userLocation}
        activeView={activeView}
        searchRadius={searchRadius}
      />
      <SiqsEffectsController
        userLocation={userLocation}
        activeView={activeView}
        searchRadius={searchRadius}
      />

      {/* Search radius circle around user location */}
      {userLocation && activeView === 'calculated' && searchRadius && (
        <Circle
          center={[userLocation.latitude, userLocation.longitude]}
          radius={searchRadius * 1000} // Convert km to meters
          pathOptions={{ 
            color: '#9b87f5', 
            fillColor: '#9b87f5', 
            fillOpacity: 0.05, 
            weight: 1, 
            dashArray: '5, 5',
            className: 'location-radius-circle'
          }}
        />
      )}

      {/* User location marker */}
      {userLocation && (
        <UserLocationMarker
          position={[userLocation.latitude, userLocation.longitude]}
          currentSiqs={currentSiqsStore.getValue()}
        />
      )}

      {/* Location markers */}
      {displayLocations.map((location) => {
        if (!location || !location.latitude || !location.longitude) return null;
        
        const locationId = location.id || 
          `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={onLocationClick}
            isHovered={hoveredLocationId === locationId}
            onHover={onMarkerHover}
            locationId={locationId}
            isCertified={isCertified}
          />
        );
      })}
    </MapContainer>
  );
};

export default MapContent;
