
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapEventsProps {
  onMapClick?: (lat: number, lng: number) => void;
}

// Component to handle map events
export const MapEvents: React.FC<MapEventsProps> = ({ onMapClick }) => {
  const map = useMap();
  
  // Set up click event handler
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e: any) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    };
    
    // Add event listener
    map.on('click', handleClick);
    
    // Clean up
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
};

// Export a world bounds controller component to limit map panning
export const WorldBoundsController: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    // Set max bounds to prevent excessive panning
    const bounds = [
      [-90, -180], // Southwest corner
      [90, 180]    // Northeast corner
    ];
    
    map.setMaxBounds(bounds);
    
    // Add padding to prevent bouncing at edges
    map.on('drag', () => {
      map.panInsideBounds(bounds, { animate: false });
    });
  }, [map]);
  
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
  const map = useMap();
  
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
