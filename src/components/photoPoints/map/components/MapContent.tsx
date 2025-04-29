
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, AttributionControl } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { LocationMarker, UserLocationMarker } from '../MarkerComponents';
import { MapEffectsComposer } from '../MapComponents';
import { useLanguage } from '@/contexts/LanguageContext';

interface MapContentProps {
  center: [number, number];
  zoom: number;
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  hoveredLocationId: string | null;
  onMarkerHover: (id: string | null) => void;
  onLocationClick: (location: SharedAstroSpot) => void;
  onMapClick: (lat: number, lng: number) => void;
  handleTouchStart: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  activeView: 'certified' | 'calculated';
  showRadiusCircles: boolean;
  isMobile: boolean;
  onMapReady: () => void;
  isForecastMode?: boolean;
  selectedForecastDay?: number;
}

const MapContent: React.FC<MapContentProps> = ({
  center,
  zoom,
  userLocation,
  locations,
  hoveredLocationId,
  onMarkerHover,
  onLocationClick,
  onMapClick,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  activeView,
  showRadiusCircles,
  isMobile,
  onMapReady,
  isForecastMode = false,
  selectedForecastDay = 0
}) => {
  const { t } = useLanguage();
  
  // Format the forecast date for display
  const formatForecastDate = (day: number): string => {
    if (day === 0) return t("Today", "今天");
    
    const date = new Date();
    date.setDate(date.getDate() + day);
    
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  useEffect(() => {
    // Call onMapReady when the component mounts
    onMapReady();
  }, [onMapReady]);

  // Create location markers
  const createLocationMarkers = () => {
    return locations.map((location) => {
      // Skip locations without valid coordinates
      if (!location.latitude || !location.longitude) return null;
      
      // Generate a unique ID for the location
      const locationId = `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
      
      // Check if this is a certified location
      const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
      
      return (
        <LocationMarker
          key={locationId}
          location={location}
          locationId={locationId}
          onClick={() => onLocationClick(location)}
          isHovered={hoveredLocationId === locationId}
          onHover={onMarkerHover}
          isCertified={isCertified}
          activeView={activeView}
          handleTouchStart={handleTouchStart}
          handleTouchEnd={handleTouchEnd}
          handleTouchMove={handleTouchMove}
          isForecast={isForecastMode && Boolean(location.isForecast)}
        />
      );
    });
  };

  // Handle click on the map to update location
  const handleMapClick = (e: any) => {
    const { lat, lng } = e.latlng;
    onMapClick(lat, lng);
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      attributionControl={true}
    >
      {/* Base map tile layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Add attribution control */}
      <AttributionControl position="bottomright" />
      
      {/* Map effects for visual enhancements */}
      <MapEffectsComposer 
        onMapClick={handleMapClick}
        showRadiusCircles={showRadiusCircles}
        userLocation={userLocation}
        activeView={activeView}
        isForecastMode={isForecastMode}
      />
      
      {/* User location marker if available */}
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]} 
          currentSiqs={null}
        />
      )}
      
      {/* Location markers */}
      {createLocationMarkers()}
      
      {/* Forecast date label if in forecast mode */}
      {isForecastMode && selectedForecastDay > 0 && (
        <div className="absolute top-4 left-4 z-[999] bg-background/80 backdrop-blur px-3 py-1 rounded-md text-sm shadow-md">
          <span className="text-primary">{formatForecastDate(selectedForecastDay)}</span>
        </div>
      )}
    </MapContainer>
  );
};

export default MapContent;
