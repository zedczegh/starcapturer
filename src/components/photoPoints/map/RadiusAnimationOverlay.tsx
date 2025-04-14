
import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface RadiusAnimationOverlayProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  isSearching: boolean;
  activeView: 'certified' | 'calculated';
}

/**
 * Simplified component that displays a radius circle with minimal animation effects
 */
const RadiusAnimationOverlay: React.FC<RadiusAnimationOverlayProps> = ({
  userLocation,
  searchRadius,
  isSearching,
  activeView
}) => {
  const map = useMap();
  const [circle, setCircle] = useState<L.Circle | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  
  // Only show animation for calculated view with active searching
  const shouldShowAnimation = activeView === 'calculated' && isSearching;
  
  // Function to update the radius circle based on current zoom level
  const updateRadiusCircle = React.useCallback(() => {
    if (!map || !userLocation) return;
    
    // Clear previous circle
    if (circleRef.current) {
      circleRef.current.removeFrom(map);
    }
    
    // Create the circle showing the search radius
    const newCircle = L.circle(
      [userLocation.latitude, userLocation.longitude],
      {
        radius: searchRadius * 1000, // Convert km to meters
        color: '#8B5CF6',
        fillColor: '#8B5CF6',
        fillOpacity: 0.05,
        weight: 1,
        dashArray: shouldShowAnimation ? '5, 5' : '',
        className: 'search-radius-circle'
      }
    ).addTo(map);
    
    circleRef.current = newCircle;
    setCircle(newCircle);
    
  }, [map, userLocation, searchRadius, shouldShowAnimation]);
  
  // Add and manage the radius circle
  useEffect(() => {
    if (!userLocation) return;
    updateRadiusCircle();
    
    // Add zoom listener to update the circle size when zooming
    const handleZoom = () => {
      updateRadiusCircle();
    };
    
    map.on('zoom', handleZoom);
    
    return () => {
      map.off('zoom', handleZoom);
      if (circleRef.current) {
        circleRef.current.removeFrom(map);
      }
    };
  }, [map, userLocation, searchRadius, updateRadiusCircle]);

  // Add minimal CSS styles - much simpler animation
  useEffect(() => {
    const styleId = 'radius-animation-styles';
    
    // Only add styles if they don't already exist
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = `
        .search-radius-circle {
          animation: pulseRadius 3s ease-in-out infinite alternate;
          pointer-events: none;
        }
        
        @keyframes pulseRadius {
          0% {
            stroke-opacity: 0.2;
            stroke-width: 1;
          }
          100% {
            stroke-opacity: 0.4;
            stroke-width: 1.5;
          }
        }
      `;
      
      document.head.appendChild(styleEl);
    }
    
    return () => {
      // We don't remove the style element to prevent flickering on re-renders
    };
  }, []);
  
  return null; // This component doesn't render any DOM elements directly
};

export default RadiusAnimationOverlay;
