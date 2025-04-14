
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
  const [prevLocation, setPrevLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Detect location changes
  useEffect(() => {
    if (!userLocation) return;
    
    // Check if location has changed
    if (
      prevLocation && 
      (prevLocation.latitude !== userLocation.latitude || 
       prevLocation.longitude !== userLocation.longitude)
    ) {
      // Only show animation for calculated view
      if (activeView === 'calculated') {
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 6000); // Show animation for 6 seconds
      }
    }
    
    setPrevLocation(userLocation);
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
  
  // Create and manage the radar sweep animation when searching or location changes
  useEffect(() => {
    // Only show radar for calculated view
    const shouldShowRadar = (isSearching || showAnimation) && activeView === 'calculated';
    
    if (!map || !userLocation || !shouldShowRadar) {
      // Remove the radar sweep when not showing
      if (radarSweep) {
        radarSweep.removeFrom(map);
        setRadarSweep(null);
      }
      return;
    }
    
    // Create container div for radar sweep with a circular mask
    const container = document.createElement('div');
    container.className = 'radar-sweep-container';
    
    // Create the actual radar sweep element that will be masked/clipped
    const sweep = document.createElement('div');
    sweep.className = 'radar-sweep';
    
    // Add sweep to container
    container.appendChild(sweep);
    
    // Calculate the radius in pixels for proper scaling
    // The icon size needs to match the actual circle radius on the map
    const radiusInMeters = searchRadius * 1000; // Convert km to meters
    const point = map.latLngToContainerPoint([userLocation.latitude, userLocation.longitude]);
    const pointRadius = map.latLngToContainerPoint([
      userLocation.latitude,
      userLocation.longitude + (radiusInMeters / 111320) // Rough conversion from meters to degrees
    ]);
    const radiusInPixels = Math.abs(point.y - pointRadius.y);
    
    // Create the icon with exact dimensions to match the circle
    const sweepIcon = L.divIcon({
      html: container,
      className: 'radar-sweep-wrapper',
      iconSize: [radiusInPixels * 2, radiusInPixels * 2],
      iconAnchor: [radiusInPixels, radiusInPixels]
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
  }, [map, userLocation, isSearching, searchRadius, showAnimation, activeView]);

  // Add CSS styles for the radar sweep animation directly
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'radius-animation-styles';
    styleEl.innerHTML = `
      .radar-sweep-wrapper {
        z-index: 400;
      }
      
      .radar-sweep-container {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        overflow: hidden;
        opacity: 0.6;
      }
      
      .radar-sweep {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: conic-gradient(
          from 0deg,
          rgba(139, 92, 246, 0.4) 0deg,
          rgba(139, 92, 246, 0.2) 60deg, 
          rgba(139, 92, 246, 0.05) 120deg,
          rgba(139, 92, 246, 0) 180deg,
          rgba(139, 92, 246, 0) 360deg
        );
        animation: radarSweep 6s linear infinite;
        filter: blur(1px);
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
        animation: pulseRadius 3s ease-in-out infinite alternate;
      }
      
      @keyframes pulseRadius {
        0% {
          stroke-opacity: 0.3;
          stroke-width: 1;
        }
        100% {
          stroke-opacity: 0.6;
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
