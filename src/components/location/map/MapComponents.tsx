
import React, { useEffect, memo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Component to update the map view when position changes
export const MapUpdater = memo(({ position }: { position: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      try {
        map.panTo(position, { animate: true, duration: 0.5 });
      } catch (error) {
        console.error("Error updating map view:", error);
      }
    }
  }, [position, map]);
  
  return null;
});

MapUpdater.displayName = 'MapUpdater';

// Interactive map component that handles clicks
export const MapEvents = memo(({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
});

MapEvents.displayName = 'MapEvents';

// Create a custom marker with animation effects
export const createCustomMarker = (): L.DivIcon => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="marker-pin-container">
        <div class="marker-pin animate-pulse-subtle"></div>
        <div class="marker-shadow"></div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42]
  });
};

// CSS injector component to inject map-specific styles
export const MapStyles = memo(() => {
  useEffect(() => {
    if (!document.getElementById('custom-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'custom-marker-styles';
      style.innerHTML = `
        .custom-map-marker {
          background: transparent;
          border: none;
        }
        .marker-pin-container {
          position: relative;
          width: 30px;
          height: 42px;
        }
        .marker-pin {
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          background: hsl(var(--primary));
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -20px 0 0 -12px;
          box-shadow: 0 0 6px rgba(0,0,0,0.3);
        }
        .marker-pin::after {
          content: '';
          width: 14px;
          height: 14px;
          margin: 5px 0 0 5px;
          background: white;
          position: absolute;
          border-radius: 50%;
        }
        .marker-shadow {
          width: 24px;
          height: 6px;
          border-radius: 50%;
          background: rgba(0,0,0,0.15);
          position: absolute;
          left: 50%;
          top: 100%;
          margin: -6px 0 0 -12px;
          transform: rotateX(55deg);
          z-index: -1;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  
  return null;
});

MapStyles.displayName = 'MapStyles';
