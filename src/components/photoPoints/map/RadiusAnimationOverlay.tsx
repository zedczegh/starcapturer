
import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface RadiusAnimationOverlayProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  isSearching: boolean;
  activeView: 'certified' | 'calculated';
}

const RadiusAnimationOverlay: React.FC<RadiusAnimationOverlayProps> = ({
  userLocation,
  searchRadius,
  isSearching,
  activeView
}) => {
  const map = useMap();
  const circleRef = useRef<L.Circle | null>(null);
  
  // Only show animation for calculated view with active searching
  const shouldShowAnimation = activeView === 'calculated' && isSearching;
  
  // Function to update the radius circle based on current zoom level
  useEffect(() => {
    // Clean up function to remove circle when component unmounts
    return () => {
      if (circleRef.current && map) {
        circleRef.current.removeFrom(map);
      }
    };
  }, [map]);
  
  // Create or update circle when relevant props change
  useEffect(() => {
    if (!map || !userLocation) return;
    
    // Clear previous circle
    if (circleRef.current) {
      circleRef.current.removeFrom(map);
      circleRef.current = null;
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
        className: shouldShowAnimation ? 'search-radius-circle' : ''
      }
    ).addTo(map);
    
    circleRef.current = newCircle;
    
    // Listen for zoom events to update circle
    const handleZoom = () => {
      if (circleRef.current && map && userLocation) {
        // Just update the position and radius if needed
        circleRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
        circleRef.current.setRadius(searchRadius * 1000);
      }
    };
    
    map.on('zoom', handleZoom);
    
    return () => {
      map.off('zoom', handleZoom);
    };
  }, [map, userLocation, searchRadius, shouldShowAnimation]);

  // Add extremely minimal CSS styles - only if animation is needed
  useEffect(() => {
    if (!shouldShowAnimation) return;
    
    const styleId = 'radius-animation-styles';
    
    // Only add styles if they don't already exist
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = `
        .search-radius-circle {
          animation: pulseOpacity 2s ease-in-out infinite alternate;
          pointer-events: none;
        }
        
        @keyframes pulseOpacity {
          0% { stroke-opacity: 0.2; }
          100% { stroke-opacity: 0.4; }
        }
      `;
      
      document.head.appendChild(styleEl);
    }
    
    return () => {
      // We don't remove the style element since other instances might use it
    };
  }, [shouldShowAnimation]);
  
  return null; // This component doesn't render any DOM elements directly
};

export default RadiusAnimationOverlay;
