
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
 * Component that displays an animated radar sweep effect to visualize the search radius
 */
const RadiusAnimationOverlay: React.FC<RadiusAnimationOverlayProps> = ({
  userLocation,
  searchRadius,
  isSearching,
  activeView
}) => {
  const map = useMap();
  const [circle, setCircle] = useState<L.Circle | null>(null);
  const [radarSweep, setRadarSweep] = useState<L.Marker | null>(null);
  const [prevLocation, setPrevLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const animationTimeoutRef = useRef<number | null>(null);
  const updateAnimationRef = useRef<number | null>(null);
  const isAnimatingRef = useRef<boolean>(false);
  
  // Only show animation for calculated view
  const shouldShowAnimation = activeView === 'calculated' && (isSearching || showAnimation);
  
  // Detect location changes and trigger animation
  useEffect(() => {
    if (!userLocation || activeView !== 'calculated') return;
    
    // If this is the first location or location has changed
    if (!prevLocation || 
        prevLocation.latitude !== userLocation.latitude || 
        prevLocation.longitude !== userLocation.longitude) {
      
      // Store new location
      setPrevLocation(userLocation);
      
      // Show animation for 5 seconds
      setShowAnimation(true);
      
      // Clear any existing timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      // Set new timeout
      animationTimeoutRef.current = window.setTimeout(() => {
        setShowAnimation(false);
        animationTimeoutRef.current = null;
      }, 5000);
    }
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [userLocation, prevLocation, activeView]);
  
  // Function to update the radius circle based on current zoom level
  const updateRadiusCircle = React.useCallback(() => {
    if (!map || !userLocation) return;
    
    // Clear previous circle
    if (circle) {
      circle.removeFrom(map);
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
        dashArray: '5, 5',
        className: 'search-radius-circle'
      }
    ).addTo(map);
    
    setCircle(newCircle);
    
    return () => {
      if (newCircle) {
        newCircle.removeFrom(map);
      }
    };
  }, [map, userLocation, searchRadius, circle]);
  
  // Function to create and update the radar sweep animation
  const createRadarSweep = React.useCallback(() => {
    if (!map || !userLocation || !shouldShowAnimation) {
      if (radarSweep) {
        radarSweep.removeFrom(map);
        setRadarSweep(null);
      }
      return;
    }

    // Calculate the proper size based on the search radius and current zoom
    const radiusInMeters = searchRadius * 1000; // Convert km to meters
    const zoom = map.getZoom();
    
    // Remove previous radar sweep to prevent duplicates
    if (radarSweep) {
      radarSweep.removeFrom(map);
    }
    
    // Create container element for the radar sweep
    const container = document.createElement('div');
    container.className = 'radar-sweep-container';
    
    // Create the actual sweep element
    const sweep = document.createElement('div');
    sweep.className = 'radar-sweep';
    container.appendChild(sweep);
    
    // Calculate icon size based on zoom level and radius
    // This formula creates a more accurate scaling with zoom
    const iconSize = Math.max(100, radiusInMeters / (Math.pow(2, 16 - zoom)));
    
    const sweepIcon = L.divIcon({
      html: container,
      className: 'radar-sweep-wrapper',
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2]
    });
    
    const sweepMarker = L.marker(
      [userLocation.latitude, userLocation.longitude], 
      { icon: sweepIcon }
    ).addTo(map);
    
    setRadarSweep(sweepMarker);
  }, [map, userLocation, shouldShowAnimation, radarSweep, searchRadius]);
  
  // Debounced function to update radar sweep
  const updateRadarSweep = React.useCallback(() => {
    // If animation is currently being updated, cancel it and queue a new update
    if (updateAnimationRef.current !== null) {
      cancelAnimationFrame(updateAnimationRef.current);
    }
    
    // Mark as animating
    isAnimatingRef.current = true;
    
    // Schedule update with requestAnimationFrame for better performance
    updateAnimationRef.current = requestAnimationFrame(() => {
      createRadarSweep();
      updateAnimationRef.current = null;
      
      // Reset animation flag after a delay
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, 100);
    });
  }, [createRadarSweep]);
  
  // Add and manage the radius circle
  useEffect(() => {
    updateRadiusCircle();
    
    return () => {
      if (circle) {
        circle.removeFrom(map);
      }
    };
  }, [map, userLocation, searchRadius, updateRadiusCircle]);
  
  // Create and manage the radar sweep animation
  useEffect(() => {
    updateRadarSweep();
    
    return () => {
      if (radarSweep) {
        radarSweep.removeFrom(map);
      }
      
      // Clean up any pending animation frame
      if (updateAnimationRef.current !== null) {
        cancelAnimationFrame(updateAnimationRef.current);
      }
    };
  }, [map, userLocation, searchRadius, shouldShowAnimation, updateRadarSweep]);
  
  // Add map zoom listener to update both elements when zoom changes
  useEffect(() => {
    if (!map) return;
    
    let zoomTimeout: number | null = null;
    
    const handleZoom = () => {
      // Clear previous timeout
      if (zoomTimeout) {
        clearTimeout(zoomTimeout);
      }
      
      // Update the radius circle immediately as it's less resource-intensive
      updateRadiusCircle();
      
      // Debounce the radar sweep update which is more resource-intensive
      zoomTimeout = window.setTimeout(() => {
        updateRadarSweep();
        zoomTimeout = null;
      }, 150);
    };
    
    map.on('zoom', handleZoom);
    
    return () => {
      map.off('zoom', handleZoom);
      if (zoomTimeout) clearTimeout(zoomTimeout);
    };
  }, [map, updateRadiusCircle, updateRadarSweep]);

  // Add CSS styles for the radar sweep animation directly
  useEffect(() => {
    const styleId = 'radius-animation-styles';
    
    // Only add styles if they don't already exist
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = `
        .radar-sweep-wrapper {
          z-index: 400;
        }
        
        .radar-sweep-container {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          opacity: 0.7;
        }
        
        .radar-sweep {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            rgba(139, 92, 246, 0.5) 0deg,
            rgba(139, 92, 246, 0.3) 60deg, 
            rgba(139, 92, 246, 0.1) 120deg,
            rgba(139, 92, 246, 0) 180deg,
            rgba(139, 92, 246, 0) 360deg
          );
          animation: radarSweep 6s linear infinite;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
          filter: blur(1px);
          width: 100%;
          height: 100%;
          clip-path: circle(50%);
        }
        
        @keyframes radarSweep {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .search-radius-circle {
          animation: pulseRadius 4s ease-in-out infinite alternate;
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
      // Only remove if we're unmounting completely
      // This prevents animation flicker when component re-renders
    };
  }, []);
  
  return null; // This component doesn't render any DOM elements directly
};

export default RadiusAnimationOverlay;
