
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MarkerStyles.css';
import { LocationMarker, UserLocationMarker } from './MarkerComponents';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { configureLeaflet } from '@/components/location/map/MapMarkerUtils';
import MapController from './MapController';
import MapLegend from './MapLegend';
import MobileMapFixer from './MobileMapFixer';

// Configure leaflet to handle marker paths
configureLeaflet();

interface LazyMapContainerProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onMapReady?: () => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  zoom?: number;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  isMobile?: boolean;
  useMobileMapFixer?: boolean;
}

const LazyMapContainer: React.FC<LazyMapContainerProps> = ({
  center,
  userLocation,
  locations,
  searchRadius,
  activeView,
  onMapReady,
  onLocationClick,
  onMapClick,
  zoom = 10,
  hoveredLocationId,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  isMobile,
  useMobileMapFixer = false
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const mapRef = useRef<any>(null);
  
  // Find user location SIQS
  useEffect(() => {
    if (userLocation && locations.length > 0) {
      const userLat = userLocation.latitude;
      const userLng = userLocation.longitude;
      
      // Find siqs of current user location from locations
      const sameLocation = locations.find(loc => 
        Math.abs(loc.latitude - userLat) < 0.0001 && 
        Math.abs(loc.longitude - userLng) < 0.0001
      );
      
      if (sameLocation && sameLocation.siqs) {
        setCurrentSiqs(sameLocation.siqs);
      } else {
        setCurrentSiqs(null);
      }
    }
  }, [userLocation, locations]);
  
  // Handle map ready
  const handleMapReady = useCallback(() => {
    setMapReady(true);
    if (onMapReady) {
      onMapReady();
    }
  }, [onMapReady]);
  
  // Handle location click
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);
  
  // Handle map click
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onMapClick) {
      onMapClick(lat, lng);
    }
  }, [onMapClick]);
  
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      ref={mapRef}
      className={`map-container ${isMobile ? 'mobile-optimized' : ''}`}
      whenReady={handleMapReady}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]} 
          currentSiqs={currentSiqs}
        />
      )}
      
      {locations.map(location => {
        if (!location.latitude || !location.longitude) return null;
        
        const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
        const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        const isHovered = hoveredLocationId === locationId;
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={handleLocationClick}
            isHovered={isHovered}
            onHover={onMarkerHover || (() => {})}
            locationId={locationId}
            isCertified={isCertified}
            activeView={activeView}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
            handleTouchMove={handleTouchMove}
          />
        );
      })}
      
      {/* Add controllers */}
      <MapController 
        userLocation={userLocation} 
        searchRadius={searchRadius}
      />
      
      {/* Add the mobile map fixer for better mobile experience */}
      {useMobileMapFixer && isMobile && <MobileMapFixer />}
      
      {/* Map legend for location types - Pass activeView prop */}
      <MapLegend 
        activeView={activeView} 
        showStarLegend={activeView === 'certified'}
        showCircleLegend={activeView === 'calculated'}
      />
    </MapContainer>
  );
};

export default LazyMapContainer;
