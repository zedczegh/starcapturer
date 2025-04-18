
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, Circle } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { LocationMarker, UserLocationMarker } from './MarkerComponents';
import useMapMarkers from '@/hooks/photoPoints/useMapMarkers';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import MapClickHandler from './MapClickHandler';

interface LazyMapContainerProps {
  center: [number, number];
  zoom: number;
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onMapReady: () => void;
  onLocationClick: (location: SharedAstroSpot) => void;
  onMapClick: (lat: number, lng: number) => void;
  isMobile: boolean;
  useMobileMapFixer?: boolean;
  showRadiusCircles?: boolean;
}

// Component to handle map center on changes
const SetViewOnChange = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
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
  isMobile,
  useMobileMapFixer = true,
  showRadiusCircles = true
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userSiqs, setUserSiqs] = useState<number | null>(null);
  const { hoveredLocationId, handleHover } = useMapMarkers();

  useEffect(() => {
    if (mapLoaded) {
      onMapReady();
    }
  }, [mapLoaded, onMapReady]);

  // Get SIQS for user location
  useEffect(() => {
    const fetchUserSiqs = async () => {
      if (userLocation && userLocation.latitude && userLocation.longitude) {
        try {
          const result = await calculateRealTimeSiqs(
            userLocation.latitude, 
            userLocation.longitude, 
            4 // Default Bortle scale for user location
          );
          
          if (result && result.siqs) {
            setUserSiqs(result.siqs);
          }
        } catch (error) {
          console.error("Error fetching user location SIQS:", error);
        }
      }
    };
    
    fetchUserSiqs();
  }, [userLocation]);

  // Log map effects applied
  useEffect(() => {
    console.log(`Map effects applied for ${activeView} view with radius ${searchRadius}km`);
  }, [activeView, searchRadius]);
  
  // Sort locations to ensure certified locations render on top
  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
      // First by certification (certified on top)
      if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) return 1;
      if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) return -1;
      
      // Then by SIQS score if available (higher score on top)
      const aScore = a.siqs ? (typeof a.siqs === 'number' ? a.siqs : (a.siqs as any)?.score || 0) : 0;
      const bScore = b.siqs ? (typeof b.siqs === 'number' ? b.siqs : (b.siqs as any)?.score || 0) : 0;
      
      return bScore - aScore;
    });
  }, [locations]);

  console.log(`LazyMapContainer rendering with ${locations.length} locations, activeView: ${activeView}`);
  
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }}
      zoomControl={!isMobile}
      attributionControl={!isMobile}
      whenReady={() => setMapLoaded(true)}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {mapLoaded && <SetViewOnChange center={center} zoom={zoom} />}
      
      <MapClickHandler onMapClick={onMapClick} />
      
      {/* Draw search radius circle if needed */}
      {showRadiusCircles && userLocation && searchRadius > 0 && (
        <Circle
          center={[userLocation.latitude, userLocation.longitude]}
          radius={searchRadius * 1000}
          stroke={true}
          weight={1}
          color="#3b82f6"
          fillColor="#3b82f6"
          fillOpacity={0.05}
        />
      )}
      
      {/* Render all location markers */}
      {sortedLocations.map((location) => {
        if (!location.id) {
          location.id = `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        }
        
        const locationId = location.id;
        const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={onLocationClick}
            isHovered={locationId === hoveredLocationId}
            onHover={handleHover}
            locationId={locationId}
            isCertified={isCertified}
            activeView={activeView}
          />
        );
      })}
      
      {/* User location marker */}
      {userLocation && userLocation.latitude && userLocation.longitude && (
        <UserLocationMarker
          position={[userLocation.latitude, userLocation.longitude]}
          currentSiqs={userSiqs}
        />
      )}
    </MapContainer>
  );
};

export default LazyMapContainer;
