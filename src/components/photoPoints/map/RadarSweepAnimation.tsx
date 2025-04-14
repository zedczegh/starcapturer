
import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

interface RadarSweepAnimationProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  isScanning: boolean;
}

const RadarSweepAnimation: React.FC<RadarSweepAnimationProps> = ({
  userLocation,
  searchRadius,
  isScanning
}) => {
  const map = useMap();
  const radarRef = useRef<HTMLDivElement | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const animationRef = useRef<number | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const { t } = useLanguage();
  
  // Create and add styles only once
  useEffect(() => {
    if (!styleRef.current) {
      const style = document.createElement('style');
      style.textContent = `
        .radar-container {
          pointer-events: none;
        }
        .radar-sweep {
          position: absolute;
          border-radius: 50%;
          background: conic-gradient(
            rgba(59, 130, 246, 0.8) 0deg,
            rgba(59, 130, 246, 0.1) 30deg,
            rgba(59, 130, 246, 0) 120deg,
            rgba(59, 130, 246, 0) 360deg
          );
          transform-origin: center;
          animation: radar-sweep 3s linear infinite;
          z-index: 400;
          pointer-events: none;
        }
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      styleRef.current = style;
    }
    
    // Clean up styles when component is unmounted
    return () => {
      if (styleRef.current && styleRef.current.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, []);

  // Create and manage the radar animation
  useEffect(() => {
    if (!userLocation) return;

    // Create or update the radius circle
    if (isScanning) {
      if (!circleRef.current) {
        circleRef.current = L.circle(
          [userLocation.latitude, userLocation.longitude],
          {
            radius: searchRadius * 1000, // Convert km to meters
            color: '#3b82f6',
            fillColor: '#3b82f680',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 10',
            interactive: false
          }
        ).addTo(map);
      } else {
        circleRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
        circleRef.current.setRadius(searchRadius * 1000);
      }

      // Create radar sweep element if it doesn't exist
      if (!radarRef.current) {
        // Create radar DOM element manually
        const radar = document.createElement('div');
        radar.className = 'radar-sweep';
        
        // Add to map container directly
        const mapContainer = map.getContainer();
        if (mapContainer) {
          const container = document.createElement('div');
          container.className = 'radar-container';
          container.style.position = 'absolute';
          container.style.zIndex = '400';
          container.style.pointerEvents = 'none';
          container.appendChild(radar);
          mapContainer.appendChild(container);
          radarRef.current = radar;
        }
        
        // Initial notification
        toast.info(t(
          "Scanning for locations within radius...",
          "正在扫描半径内的位置..."
        ));
      }
      
      // Show the radar sweep
      if (radarRef.current) {
        radarRef.current.style.display = 'block';
      }

      // Update radar position and size
      const updateRadarPosition = () => {
        if (!radarRef.current || !userLocation || !map.getContainer()) return;
        
        // Get user position in pixel coordinates
        const userLatLng = L.latLng(userLocation.latitude, userLocation.longitude);
        const point = map.latLngToContainerPoint(userLatLng);
        
        // Calculate radius in pixels based on the current zoom level
        const radiusInMeters = searchRadius * 1000;
        const edge = L.latLng(
          userLocation.latitude + (radiusInMeters / 111320), // 1 degree ~ 111.32 km
          userLocation.longitude
        );
        const edgePoint = map.latLngToContainerPoint(edge);
        const radiusInPixels = Math.max(10, Math.abs(edgePoint.x - point.x)); // Ensure minimum size
        
        const size = radiusInPixels * 2;
        
        // Update radar element position and size
        radarRef.current.style.width = `${size}px`;
        radarRef.current.style.height = `${size}px`;
        radarRef.current.style.left = `${point.x - radiusInPixels}px`;
        radarRef.current.style.top = `${point.y - radiusInPixels}px`;
      };

      // Set up debounced zoom and move listeners to prevent too frequent updates
      let timeout: number | null = null;
      const handleMapChange = () => {
        if (timeout) {
          window.clearTimeout(timeout);
        }
        timeout = window.setTimeout(() => {
          updateRadarPosition();
        }, 100); // Debounce for 100ms
      };

      map.on('zoom', handleMapChange);
      map.on('move', handleMapChange);
      
      // Initial position update
      updateRadarPosition();

      // Clean up
      return () => {
        map.off('zoom', handleMapChange);
        map.off('move', handleMapChange);
        
        if (timeout) {
          window.clearTimeout(timeout);
        }
      };
    } else {
      // Hide the radar sweep when not scanning
      if (radarRef.current) {
        radarRef.current.style.display = 'none';
      }
      
      // Remove circle when not scanning
      if (circleRef.current) {
        circleRef.current.removeFrom(map);
        circleRef.current = null;
      }
    }
  }, [userLocation, searchRadius, map, isScanning, t]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (circleRef.current) {
        circleRef.current.removeFrom(map);
        circleRef.current = null;
      }
      
      if (radarRef.current && radarRef.current.parentElement) {
        if (radarRef.current.parentElement.parentElement) {
          radarRef.current.parentElement.parentElement.removeChild(radarRef.current.parentElement);
        }
        radarRef.current = null;
      }
      
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [map]);

  return null;
};

export default RadarSweepAnimation;
