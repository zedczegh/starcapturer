
import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

interface RadiusAnimationOverlayProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  isSearching: boolean;
}

/**
 * Component that displays an animated radar sweep effect to visualize the search radius
 */
const RadiusAnimationOverlay: React.FC<RadiusAnimationOverlayProps> = ({
  userLocation,
  searchRadius,
  isSearching
}) => {
  const map = useMap();
  const [circle, setCircle] = useState<L.Circle | null>(null);
  const [radarSweep, setRadarSweep] = useState<L.Circle | null>(null);
  
  // Add and manage the radius circle
  useEffect(() => {
    if (!map || !userLocation) return;
    
    // Clear previous circles
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
  }, [map, userLocation, searchRadius]);
  
  // Create and manage the radar sweep animation when searching
  useEffect(() => {
    if (!map || !userLocation || !isSearching) {
      // Remove the radar sweep when not searching
      if (radarSweep) {
        radarSweep.removeFrom(map);
        setRadarSweep(null);
      }
      return;
    }
    
    // Create radar sweep effect
    const sweep = document.createElement('div');
    sweep.className = 'radar-sweep';
    
    // Add the sweep element to the map's overlay pane
    const sweepIcon = L.divIcon({
      html: sweep,
      className: 'radar-sweep-container',
      iconSize: [searchRadius * 20, searchRadius * 20],
      iconAnchor: [searchRadius * 10, searchRadius * 10]
    });
    
    const sweepMarker = L.marker(
      [userLocation.latitude, userLocation.longitude], 
      { icon: sweepIcon }
    ).addTo(map);
    
    setRadarSweep(sweepMarker as unknown as L.Circle);
    
    return () => {
      if (sweepMarker) {
        sweepMarker.removeFrom(map);
      }
    };
  }, [map, userLocation, isSearching, searchRadius]);

  // Add CSS styles for the radar sweep animation directly
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'radius-animation-styles';
    styleEl.innerHTML = `
      .radar-sweep-container {
        z-index: 400;
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
          rgba(139, 92, 246, 0.3) 45deg, 
          rgba(139, 92, 246, 0.1) 90deg,
          rgba(139, 92, 246, 0) 180deg,
          rgba(139, 92, 246, 0) 360deg
        );
        animation: radarSweep 2.5s linear infinite;
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
        animation: pulseRadius 2s ease-in-out infinite alternate;
      }
      
      @keyframes pulseRadius {
        0% {
          stroke-opacity: 0.3;
          stroke-width: 1;
        }
        100% {
          stroke-opacity: 0.7;
          stroke-width: 2;
        }
      }
    `;
    
    document.head.appendChild(styleEl);
    
    return () => {
      const existingStyle = document.getElementById('radius-animation-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);
  
  return null; // This component doesn't render any DOM elements directly
};

export default RadiusAnimationOverlay;
