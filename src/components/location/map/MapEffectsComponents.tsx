
import React, { useEffect } from "react";
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
  position 
}: { 
  isDarkSkyReserve?: boolean; 
  position: [number, number];
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!isDarkSkyReserve || !map) return;
    
    // Create a circular overlay for the dark sky region
    const circle = L.circle(position, {
      radius: 10000, // 10km radius
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 1
    }).addTo(map);
    
    return () => {
      if (circle) {
        try {
          map.removeLayer(circle);
        } catch (error) {
          console.error("Error removing circle overlay:", error);
        }
      }
    };
  }, [isDarkSkyReserve, position, map]);
  
  return null;
}

// Add a radar scanning animation for search radius
export function SearchRadiusOverlay({
  position,
  radius,
  isLoading,
  color = '#4ADE80'
}: {
  position: [number, number];
  radius: number;
  isLoading?: boolean;
  color?: string;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !position || !radius) return;
    
    // Convert km to meters
    const radiusInMeters = radius * 1000;
    
    // Create a circular overlay for the search radius
    const circle = L.circle(position, {
      radius: radiusInMeters,
      color: color,
      fillColor: color,
      fillOpacity: 0.03,
      weight: 2,
      className: isLoading ? 'radar-scanning-animation' : '',
      dashArray: isLoading ? '8, 12' : '',
    }).addTo(map);
    
    // For loading state, add the radar scanning animation via DOM manipulation
    // This ensures it works across different browsers
    if (isLoading && circle) {
      const circleElement = circle.getElement();
      if (circleElement) {
        circleElement.classList.add('radar-scanning-animation');
        
        // Add animation styles directly to ensure they work
        const style = document.createElement('style');
        style.textContent = `
          .radar-scanning-animation {
            animation: radar-scan 6s linear infinite !important;
            stroke-dasharray: 8, 12 !important;
            stroke-opacity: 0.8 !important;
            fill-opacity: 0.05 !important;
          }

          @keyframes radar-scan {
            0% {
              stroke-dashoffset: 0;
              opacity: 0.8;
              stroke-width: 2;
            }
            50% {
              opacity: 0.4;
              stroke-width: 1;
            }
            100% {
              stroke-dashoffset: -628;
              opacity: 0.8;
              stroke-width: 2;
            }
          }
        `;
        document.head.appendChild(style);
        
        return () => {
          document.head.removeChild(style);
        };
      }
    }
    
    return () => {
      if (circle) {
        try {
          map.removeLayer(circle);
        } catch (error) {
          console.error("Error removing radius overlay:", error);
        }
      }
    };
  }, [map, position, radius, isLoading, color]);
  
  return null;
}
