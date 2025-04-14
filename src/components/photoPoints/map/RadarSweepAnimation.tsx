
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
  const { t } = useLanguage();

  // Create and manage the radar animation
  useEffect(() => {
    if (!userLocation || !isScanning) return;

    // Create or update the radius circle
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

    // Create radar sweep element if not exists
    if (!radarRef.current) {
      // Create a custom control for the radar animation
      const RadarControl = L.Control.extend({
        options: {
          position: 'topleft'
        },
        onAdd: () => {
          const container = L.DomUtil.create('div', 'radar-container');
          container.style.position = 'absolute';
          container.style.pointerEvents = 'none';
          container.style.zIndex = '400';

          const radar = L.DomUtil.create('div', 'radar-sweep', container);
          radarRef.current = radar;
          
          return container;
        }
      });

      new RadarControl().addTo(map);

      // Add radar sweep styles
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
        }
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);

      // Initial notification
      toast.info(t(
        "Scanning for locations within radius...",
        "正在扫描半径内的位置..."
      ));
    }

    // Update radar position and size on map changes
    const updateRadarPosition = () => {
      if (!radarRef.current || !userLocation || !map || !circleRef.current) return;
      
      const userLatLng = L.latLng(userLocation.latitude, userLocation.longitude);
      const point = map.latLngToContainerPoint(userLatLng);
      
      // Calculate radius in pixels
      const radiusInMeters = searchRadius * 1000;
      const edge = L.latLng(
        userLocation.latitude + (radiusInMeters / 111320), // 1 degree ~ 111.32 km
        userLocation.longitude
      );
      const edgePoint = map.latLngToContainerPoint(edge);
      const radiusInPixels = Math.abs(edgePoint.x - point.x);
      
      const size = radiusInPixels * 2;
      
      // Update radar element position and size
      radarRef.current.style.width = `${size}px`;
      radarRef.current.style.height = `${size}px`;
      radarRef.current.style.left = `${point.x - radiusInPixels}px`;
      radarRef.current.style.top = `${point.y - radiusInPixels}px`;
    };

    // Set up zoom and move listeners
    const handleMapChange = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(updateRadarPosition);
    };

    map.on('zoom', handleMapChange);
    map.on('move', handleMapChange);
    
    // Initial position update
    updateRadarPosition();

    // Clean up
    return () => {
      map.off('zoom', handleMapChange);
      map.off('move', handleMapChange);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [userLocation, searchRadius, map, isScanning, t]);

  // Clean up when scanning is complete or component unmounts
  useEffect(() => {
    if (!isScanning && circleRef.current) {
      circleRef.current.removeFrom(map);
      circleRef.current = null;
    }
    
    if (!isScanning && radarRef.current) {
      // Hide the radar sweep
      radarRef.current.style.display = 'none';
    } else if (isScanning && radarRef.current) {
      // Show the radar sweep
      radarRef.current.style.display = 'block';
    }
    
    return () => {
      if (circleRef.current) {
        circleRef.current.removeFrom(map);
        circleRef.current = null;
      }
    };
  }, [isScanning, map]);

  return null;
};

export default RadarSweepAnimation;
