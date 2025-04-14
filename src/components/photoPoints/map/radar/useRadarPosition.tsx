
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
    // Initialize with null styles if conditions aren't met
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
    // Always create timeout ref even if we don't use it
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    const handleMapChange = () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        updateRadarPosition();
      }, 100); // Debounce for 100ms
    };
    
    // Only add listeners if we need to show animation
    if (map && userLocation && showAnimation) {
      updateRadarPosition();
      
      map.on('zoom', handleMapChange);
      map.on('move', handleMapChange);
      map.on('moveend', handleMapChange);
    } else {
      // Always call updateRadarPosition to ensure proper state
      updateRadarPosition();
    }
    
    // Clean up
    return () => {
      if (map) {
        map.off('zoom', handleMapChange);
        map.off('move', handleMapChange);
        map.off('moveend', handleMapChange);
      }
      
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [map, userLocation, showAnimation, updateRadarPosition]);
  
  return { radarStyles, updateRadarPosition };
};
