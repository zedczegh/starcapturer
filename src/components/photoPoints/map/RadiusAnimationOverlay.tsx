
import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [radarSweep, setRadarSweep] = useState<L.Circle | null>(null);
  const [prevLocation, setPrevLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  
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
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [userLocation, prevLocation, activeView]);
  
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
  
  // Create and manage the radar sweep animation when location changes or during search
  useEffect(() => {
    if (!map || !userLocation || !shouldShowAnimation) {
      // Remove the radar sweep when not showing animation
      if (radarSweep) {
        radarSweep.removeFrom(map);
        setRadarSweep(null);
      }
      return;
    }
    
    // Calculate the radius in pixels for the animation
    const radiusInMeters = searchRadius * 1000; // Convert km to meters
    
    // Create radar sweep effect that's confined to the radius
    const sweep = document.createElement('div');
    sweep.className = 'radar-sweep';
    
    // Add the sweep element to the map's overlay pane
    const sweepIcon = L.divIcon({
      html: sweep,
      className: 'radar-sweep-container',
      iconSize: [radiusInMeters / 50, radiusInMeters / 50], // Size relative to the radius
      iconAnchor: [radiusInMeters / 100, radiusInMeters / 100]
    });
    
    const sweepMarker = L.marker(
      [userLocation.latitude, userLocation.longitude], 
      { icon: sweepIcon, interactive: false }
    ).addTo(map);
    
    setRadarSweep(sweepMarker as unknown as L.Circle);
    
    return () => {
      if (sweepMarker) {
        sweepMarker.removeFrom(map);
      }
    };
  }, [map, userLocation, searchRadius, shouldShowAnimation]);

  // Add CSS styles for the radar sweep animation directly
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'radius-animation-styles';
    styleEl.innerHTML = `
      .radar-sweep-container {
        z-index: 400;
        opacity: 0.7;
        pointer-events: none;
      }
      
      .radar-sweep {
        position: absolute;
        width: ${searchRadius * 2000}px;
        height: ${searchRadius * 2000}px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: conic-gradient(
          from 0deg,
          rgba(139, 92, 246, 0.4) 0deg,
          rgba(139, 92, 246, 0.2) 60deg, 
          rgba(139, 92, 246, 0.05) 120deg,
          rgba(139, 92, 246, 0) 180deg,
          rgba(139, 92, 246, 0) 360deg
        );
        animation: radarSweep 8s linear infinite;
        box-shadow: 0 0 20px rgba(139, 92, 246, 0.15);
        filter: blur(2px);
        mask-image: radial-gradient(circle, black 0%, black 100%);
        -webkit-mask-image: radial-gradient(circle, black 0%, black 100%);
        overflow: hidden;
        clip-path: circle(50%);
      }
      
      @keyframes radarSweep {
        from {
          transform: translate(-50%, -50%) rotate(0deg);
        }
        to {
          transform: translate(-50%, -50%) rotate(360deg);
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
    
    return () => {
      const existingStyle = document.getElementById('radius-animation-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [searchRadius]);
  
  return null; // This component doesn't render any DOM elements directly
};

export default RadiusAnimationOverlay;
