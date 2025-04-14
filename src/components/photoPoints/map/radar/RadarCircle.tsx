
import React, { useRef, useEffect } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

interface RadarCircleProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  showCircle: boolean;
}

/**
 * Component that renders a circle around user location with specified radius
 */
const RadarCircle: React.FC<RadarCircleProps> = ({ 
  userLocation, 
  searchRadius,
  showCircle
}) => {
  const map = useMap();
  const circleRef = useRef<L.Circle | null>(null);
  
  useEffect(() => {
    if (!userLocation) return;
    
    // Ensure we always have a radius circle showing with the animation
    const radiusInMeters = Math.max(searchRadius * 1000, 5000); // Minimum 5km for visibility
    
    // Create or update the radius circle
    const createOrUpdateCircle = () => {
      if (!userLocation || !showCircle) {
        // Remove circle when not needed
        if (circleRef.current) {
          circleRef.current.removeFrom(map);
          circleRef.current = null;
        }
        return;
      }

      const latLng = [userLocation.latitude, userLocation.longitude] as [number, number];
      
      if (!circleRef.current) {
        circleRef.current = L.circle(
          latLng,
          {
            radius: radiusInMeters,
            color: '#3b82f6',
            fillColor: '#3b82f680',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 10',
            interactive: false
          }
        ).addTo(map);
        
        console.log(`Created circle with radius: ${radiusInMeters}m`);
      } else {
        circleRef.current.setLatLng(latLng);
        circleRef.current.setRadius(radiusInMeters);
        console.log(`Updated circle with radius: ${radiusInMeters}m`);
      }
    };
    
    createOrUpdateCircle();
    
    // Update circle on map move/zoom
    const handleMapChange = () => {
      createOrUpdateCircle();
    };
    
    map.on('zoom', handleMapChange);
    map.on('move', handleMapChange);
    
    // Clean up
    return () => {
      map.off('zoom', handleMapChange);
      map.off('move', handleMapChange);
      
      if (circleRef.current) {
        circleRef.current.removeFrom(map);
        circleRef.current = null;
      }
    };
  }, [map, userLocation, searchRadius, showCircle]);
  
  return null;
};

export default RadarCircle;
