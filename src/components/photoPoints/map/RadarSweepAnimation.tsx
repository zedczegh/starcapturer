import React, { useEffect, useRef, useState } from 'react';
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
  const [showAnimation, setShowAnimation] = useState(false);
  const visibilityTimeoutRef = useRef<number | null>(null);
  const { t } = useLanguage();
  
  // Create and add styles only once
  useEffect(() => {
    if (!styleRef.current) {
      const style = document.createElement('style');
      style.textContent = `
        .radar-container {
          pointer-events: none;
          z-index: 400;
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
          animation: radar-sweep 4s linear infinite;
          z-index: 400;
          pointer-events: none;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
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

  // Handle animation visibility state
  useEffect(() => {
    // When scanning starts, immediately show animation
    if (isScanning) {
      setShowAnimation(true);
      
      // Clear any existing timeout
      if (visibilityTimeoutRef.current) {
        window.clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
    } else if (showAnimation) {
      // When scanning stops, keep animation visible for a while
      if (visibilityTimeoutRef.current) {
        window.clearTimeout(visibilityTimeoutRef.current);
      }
      
      // Keep animation visible for 6 seconds after scanning completes
      visibilityTimeoutRef.current = window.setTimeout(() => {
        setShowAnimation(false);
        visibilityTimeoutRef.current = null;
      }, 6000);
    }
    
    return () => {
      if (visibilityTimeoutRef.current) {
        window.clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
    };
  }, [isScanning, showAnimation]);

  // Create and manage the radar animation and circle
  useEffect(() => {
    if (!userLocation) return;
    
    // Ensure we always have a radius circle showing with the animation
    const radiusInMeters = Math.max(searchRadius * 1000, 5000); // Minimum 5km for visibility
    
    // Create or update the radius circle
    const createOrUpdateCircle = () => {
      if (!userLocation || !showAnimation) return;

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
    
    // Remove circle when animation is hidden
    if (!showAnimation && circleRef.current) {
      circleRef.current.removeFrom(map);
      circleRef.current = null;
      
      // Also remove radar element
      if (radarRef.current && radarRef.current.parentElement) {
        if (radarRef.current.parentElement.parentElement) {
          radarRef.current.parentElement.parentElement.removeChild(radarRef.current.parentElement);
        }
        radarRef.current = null;
      }
      return;
    }

    // Show circle when animation is visible
    if (showAnimation) {
      createOrUpdateCircle();
      
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
          container.appendChild(radar);
          mapContainer.appendChild(container);
          radarRef.current = radar;
        }
        
        // Initial notification
        if (isScanning) {
          toast.info(t(
            "Scanning for locations within radius...",
            "正在扫描半径内的位置..."
          ));
        }
      }
      
      // Update radar position and size
      const updateRadarPosition = () => {
        if (!radarRef.current || !userLocation || !map.getContainer()) return;
        
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
        
        // Important: Update radar element position and size
        // The -radiusInPixels ensures perfect centering
        radarRef.current.style.width = `${size}px`;
        radarRef.current.style.height = `${size}px`;
        radarRef.current.style.left = `${point.x - radiusInPixels}px`;
        radarRef.current.style.top = `${point.y - radiusInPixels}px`;
        
        // Apply hardware acceleration for smoother animations
        radarRef.current.style.transform = 'translate3d(0,0,0)';
        radarRef.current.style.backfaceVisibility = 'hidden';
        
        // Also update the circle to ensure alignment
        if (circleRef.current) {
          circleRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
          circleRef.current.setRadius(radiusInMeters);
        }
      };
      
      // Initial position update
      updateRadarPosition();
      
      // Set up debounced zoom and move listeners
      let timeout: number | null = null;
      const handleMapChange = () => {
        if (timeout) {
          window.clearTimeout(timeout);
        }
        timeout = window.setTimeout(() => {
          updateRadarPosition();
          createOrUpdateCircle(); // Also update circle on map changes
        }, 100); // Debounce for 100ms
      };
      
      map.on('zoom', handleMapChange);
      map.on('move', handleMapChange);
      
      // Clean up
      return () => {
        map.off('zoom', handleMapChange);
        map.off('move', handleMapChange);
        
        if (timeout) {
          window.clearTimeout(timeout);
        }
      };
    }
  }, [userLocation, searchRadius, map, showAnimation, isScanning, t]);

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
      
      if (visibilityTimeoutRef.current) {
        window.clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
    };
  }, [map]);

  return null;
};

export default RadarSweepAnimation;
