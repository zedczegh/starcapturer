
import React, { useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { LocationMarker, UserLocationMarker } from './MarkerComponents';
import { MAP_ATTRIBUTION, getTileLayerUrl } from '@/components/location/map/MapMarkerUtils';

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

// Map controller component to handle clicks without re-renders
const MapController: React.FC<{ onClick: (lat: number, lng: number) => void }> = ({ onClick }) => {
  const map = useMap();
  
  // Setup click handler only once
  React.useEffect(() => {
    const handleMapClick = (e: any) => {
      onClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onClick]);
  
  return null;
};

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
  // Memoize tile layer options for better performance
  const attribution = useMemo(() => MAP_ATTRIBUTION, []);
  const tileUrl = useMemo(() => getTileLayerUrl(), []);
  
  // Use stable handler for map click events
  const handleMapClick = useCallback((lat: number, lng: number) => {
    onMapClick(lat, lng);
  }, [onMapClick]);
  
  return (
    <MapContainer
      center={position}
      zoom={10}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      whenReady={onMapReady}
      attributionControl={false}
      worldCopyJump={true}
      preferCanvas={true} // Use canvas renderer for better performance
      maxZoom={18}
      minZoom={2}
    >
      <TileLayer
        attribution={attribution}
        url={tileUrl}
        maxZoom={18}
        updateWhenIdle={true} // Only update when map is idle
        updateWhenZooming={false} // Don't update during zoom
        keepBuffer={2} // Keep more tiles in buffer
      />
      
      {editable && (
        <MapController onClick={handleMapClick} />
      )}
      
      <UserLocationMarker 
        position={position} 
        isDarkSkyReserve={isDarkSkyReserve}
        certification={certification}
        locationName={locationName}
      />
    </MapContainer>
  );
};

export default React.memo(LazyMapComponent);
