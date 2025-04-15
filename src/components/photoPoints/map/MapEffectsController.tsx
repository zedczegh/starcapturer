
import React, { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';

interface MapEventsProps {
  onMapClick?: (lat: number, lng: number) => void;
}

// Component to handle map events
export const MapEvents: React.FC<MapEventsProps> = ({ onMapClick }) => {
  const map = useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  
  return null;
};

interface MapEffectsComposerProps {
  center: [number, number];
  zoom: number;
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onSiqsCalculated?: (siqs: number) => void;
}

// Component to compose various map effects
export const MapEffectsComposer: React.FC<MapEffectsComposerProps> = ({
  center,
  zoom,
  userLocation,
  activeView,
  searchRadius,
  onSiqsCalculated
}) => {
  // Initialize with proper center and zoom
  const map = useMapEvents({});
  
  // Make sure map is centered on initial load
  useEffect(() => {
    if (map) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  
  // Update SIQS at user location if needed
  useEffect(() => {
    if (userLocation && onSiqsCalculated) {
      // This would normally call a service to calculate SIQS
      // For now we'll skip the implementation as it's not part of the requested changes
    }
  }, [userLocation, onSiqsCalculated]);
  
  return null;
};

export default MapEvents;
