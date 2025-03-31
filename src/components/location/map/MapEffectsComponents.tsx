
import React, { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Update map view when center position changes
export function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    try {
      map.setView(position, map.getZoom(), {
        animate: true,
        duration: 1
      });
    } catch (error) {
      console.error("Error updating map view:", error);
    }
  }, [map, position]);
  
  return null;
}

// Handle map click events for editable maps
export function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
}

// Apply additional dark sky overlay for certified locations
export function DarkSkyOverlay({ 
  isDarkSkyReserve, 
  position,
  radiusKm = 10,
  color = '#3b82f6'
}: { 
  isDarkSkyReserve?: boolean; 
  position: [number, number];
  radiusKm?: number;
  color?: string;
}) {
  const map = useMap();
  const [circle, setCircle] = useState<L.Circle | null>(null);
  
  useEffect(() => {
    if (!isDarkSkyReserve || !map) return;
    
    try {
      // Remove previous circle if it exists
      if (circle) {
        circle.remove();
      }
      
      // Convert radius from km to meters
      const radiusMeters = radiusKm * 1000;
      
      // Create a circular overlay for the dark sky region
      const newCircle = L.circle(position, {
        radius: radiusMeters,
        color: color,
        fillColor: color,
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5',
        className: 'dark-sky-overlay'
      }).addTo(map);
      
      // Add a pulsing animation effect
      const pulseEffect = document.createElement('style');
      pulseEffect.innerHTML = `
        @keyframes pulse {
          0% { stroke-opacity: 0.8; stroke-width: 2; }
          50% { stroke-opacity: 0.3; stroke-width: 3; }
          100% { stroke-opacity: 0.8; stroke-width: 2; }
        }
        .dark-sky-overlay {
          animation: pulse 3s infinite;
        }
      `;
      document.head.appendChild(pulseEffect);
      
      // Save the circle reference
      setCircle(newCircle);
      
      return () => {
        if (newCircle) {
          try {
            newCircle.remove();
          } catch (error) {
            console.error("Error removing circle overlay:", error);
          }
        }
        document.head.removeChild(pulseEffect);
      };
    } catch (error) {
      console.error("Error creating dark sky overlay:", error);
      return undefined;
    }
  }, [isDarkSkyReserve, position, map, radiusKm, color]);
  
  return null;
}
