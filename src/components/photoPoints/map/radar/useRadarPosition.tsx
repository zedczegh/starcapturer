
import { useCallback, useEffect, useState } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

interface UseRadarPositionProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  showAnimation: boolean;
}

/**
 * Custom hook to manage radar position on map
 */
export const useRadarPosition = ({ 
  userLocation, 
  searchRadius, 
  showAnimation 
}: UseRadarPositionProps) => {
  const map = useMap();
  const [radarStyles, setRadarStyles] = useState<{
    size: number;
    left: number;
    top: number;
  } | null>(null);
  
  // Update radar position on the map
  const updateRadarPosition = useCallback(() => {
    // Always run the function but only set styles if conditions met
    if (!userLocation || !map || !showAnimation) {
      setRadarStyles(null);
      return;
    }
    
    // Get user position in pixel coordinates - critical for precise centering
    const userLatLng = L.latLng(userLocation.latitude, userLocation.longitude);
    const point = map.latLngToContainerPoint(userLatLng);
    
    // Calculate radius in pixels based on the current zoom level
    const radiusInMeters = Math.max(searchRadius * 1000, 5000); // Minimum 5km for visibility
    const edge = L.latLng(
      userLocation.latitude + (radiusInMeters / 111320), // 1 degree ~ 111.32 km
      userLocation.longitude
    );
    const edgePoint = map.latLngToContainerPoint(edge);
    const radiusInPixels = Math.max(80, Math.abs(edgePoint.x - point.x)); // Ensure minimum size of 80px
    
    const size = radiusInPixels * 2;
    
    // Ensure exact centering by calculating the exact left/top position
    // The point is at the center of the circle, so we need to subtract half the size
    setRadarStyles({
      size,
      left: point.x - radiusInPixels,
      top: point.y - radiusInPixels
    });
  }, [map, userLocation, searchRadius, showAnimation]);
  
  // Set up event listeners for map movements
  useEffect(() => {
    // Initialize even if conditions aren't met yet
    let timeout: number | null = null;
    
    const handleMapChange = () => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
      timeout = window.setTimeout(() => {
        updateRadarPosition();
      }, 100); // Debounce for 100ms
    };
    
    // Only add listeners if we need to show animation
    if (map && userLocation && showAnimation) {
      updateRadarPosition();
      
      map.on('zoom', handleMapChange);
      map.on('move', handleMapChange);
      map.on('moveend', handleMapChange);
    }
    
    // Clean up
    return () => {
      if (map) {
        map.off('zoom', handleMapChange);
        map.off('move', handleMapChange);
        map.off('moveend', handleMapChange);
      }
      
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, [map, userLocation, showAnimation, updateRadarPosition]);
  
  return { radarStyles, updateRadarPosition };
};
