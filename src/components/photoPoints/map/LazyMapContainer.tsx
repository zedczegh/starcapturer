
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MarkerStyles.css';
import './MapStyles.css';
import { LocationMarker, UserLocationMarker } from './MarkerComponents';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { configureLeaflet } from '@/components/location/map/MapMarkerUtils';
import MapController from './MapController';
import MapLegend from './MapLegend';
import MobileMapFixer from './MobileMapFixer';
import { MapEvents, WorldBoundsController } from './MapEffectsController';
import PinpointButton from './PinpointButton';
import { getCurrentPosition } from '@/utils/geolocationUtils';
import { MapEffectsComposer } from './MapComponents';

// Configure Leaflet before any map component renders
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
  showRadiusCircles?: boolean;
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
  useMobileMapFixer = false,
  showRadiusCircles = false
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Effect to find SIQS value of user's current location
  useEffect(() => {
    if (userLocation && locations.length > 0) {
      const userLat = userLocation.latitude;
      const userLng = userLocation.longitude;
      
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
  
  // Handler for when the map is ready
  const handleMapReady = useCallback(() => {
    setMapReady(true);
    if (onMapReady) {
      onMapReady();
    }
    
    // Set global map reference for debugging
    if (mapRef.current) {
      (window as any).leafletMap = mapRef.current;
    }
  }, [onMapReady]);
  
  // Location click handler
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);
  
  // Map click handler
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onMapClick) {
      onMapClick(lat, lng);
      console.log("Map clicked, updating location to:", lat, lng);
    }
  }, [onMapClick]);
  
  // Get user's geolocation
  const handleGetLocation = useCallback(() => {
    if (onMapClick) {
      getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onMapClick(latitude, longitude);
          
          if (mapRef.current) {
            const leafletMap = mapRef.current;
            leafletMap.setView([latitude, longitude], 12, {
              animate: true,
              duration: 1
            });
          }
          
          console.log("Got user position:", latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }, [onMapClick]);
  
  // Effect to ensure map is properly sized and invalidate size on container resize
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    // Handle window resize events to properly resize the map
    const handleResize = () => {
      // Add a small delay to ensure the DOM has updated
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial invalidateSize to prevent _leaflet_pos errors
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mapRef.current]);
  
  return (
    <div ref={mapContainerRef} className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        ref={mapRef}
        className={`map-container ${isMobile ? 'mobile-optimized' : ''}`}
        whenReady={handleMapReady}
        attributionControl={true}
        key={`map-${center[0]}-${center[1]}-${searchRadius}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {showRadiusCircles && userLocation && (
          <Circle
            center={[userLocation.latitude, userLocation.longitude]}
            pathOptions={{
              color: 'rgb(99, 102, 241)',
              fillColor: 'rgb(99, 102, 241)',
              fillOpacity: 0.05,
              weight: 1,
              dashArray: '5, 5',
            }}
            radius={searchRadius * 1000}
          />
        )}
        
        <MapEffectsComposer 
          center={center}
          zoom={zoom}
          userLocation={userLocation}
          activeView={activeView}
          searchRadius={searchRadius}
          onSiqsCalculated={(siqs) => setCurrentSiqs(siqs)}
        />
        
        <MapEvents onMapClick={handleMapClick} />
        
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
          
          return (
            <LocationMarker
              key={locationId}
              location={location}
              onClick={handleLocationClick}
              isCertified={isCertified}
              activeView={activeView}
            />
          );
        })}
        
        <MapController 
          userLocation={userLocation} 
          searchRadius={searchRadius}
        />
        
        {useMobileMapFixer && isMobile && <MobileMapFixer />}
      </MapContainer>
    </div>
  );
};

export default LazyMapContainer;
